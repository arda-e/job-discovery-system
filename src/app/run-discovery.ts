import {
  type AppConfig,
  type DiscoverConfig,
  loadDiscoverConfig,
  summarizeAppConfig
} from "../config/env";
import {
  type DiscoveryProfile,
  loadDiscoveryProfile,
  parseDiscoveryProfile
} from "../config/discovery-profile";
import {
  createTitleKeywordFilter,
  DEFAULT_TITLE_KEYWORD_FILTER,
  type TitleKeywordFilterConfig
} from "../domain/filters/title-keyword-filter";
import {
  generateDiscoveryQuery,
  resolveExaSearchInput as resolveExaInputFromQuery,
  type ExaTuningDefaults
} from "../domain/query-generation";
import { secretsService } from "../integrations/aws/secrets";
import {
  ExaSearchAdapter,
  type ExaSearchInput,
} from "../sources/search/exa";
import type { Logger } from "../util/logger";
import { runAggregationPipeline } from "../domain/aggregation/pipeline";

export type DiscoverMode = "smoke" | "discover";

export type DiscoverInvocation = {
  exaSearch?: Partial<ExaSearchInput>;
  mode?: DiscoverMode;
  profile?: Partial<DiscoveryProfile>;
  titleFilter?: Partial<TitleKeywordFilterConfig>;
};

export type DiscoverResult = {
  message: string;
  mode: DiscoverMode;
};

export type RunDiscoveryDependencies = {
  config: AppConfig;
  logger: Logger;
};

export type DiscoveryRunContext = {
  appConfig: AppConfig;
  discoverConfig?: DiscoverConfig;
  exaApiKey?: string;
  exaSearchInput?: ExaSearchInput;
  invocation: DiscoverInvocation;
  logger: Logger;
  mode: DiscoverMode;
  titleKeywordFilterConfig?: TitleKeywordFilterConfig;
};

const DEFAULT_EXA_TUNING_DEFAULTS: ExaTuningDefaults = {
  maxCharacters: 1_500,
  numResults: 3,
  type: "deep"
};

/**
 * Waits for the given number of milliseconds.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Resolves the invocation mode, defaulting to the smoke path.
 */
const resolveMode = (invocation: DiscoverInvocation): DiscoverMode =>
  invocation.mode ?? "smoke";

/**
 * Resolves title filter parameters from the invocation event with safe defaults.
 */
const resolveTitleKeywordFilterConfig = (
  invocation: DiscoverInvocation
): TitleKeywordFilterConfig => ({
  exclude:
    invocation.titleFilter?.exclude ?? DEFAULT_TITLE_KEYWORD_FILTER.exclude,
  include:
    invocation.titleFilter?.include ?? DEFAULT_TITLE_KEYWORD_FILTER.include
});

/**
 * Validates the explicit query override, rejecting blank or whitespace-only values.
 */
const validateExplicitQueryOverride = (
  query: string | undefined
): string | undefined => {
  if (query === undefined) {
    return undefined;
  }
  if (query.trim().length === 0) {
    throw new Error(
      "Invalid discovery invocation: explicit query override must not be blank"
    );
  }
  return query;
};

/**
 * Validates Exa tuning overrides, rejecting non-positive numeric values.
 */
const validateExaTuningOverrides = (
  overrides: Partial<ExaSearchInput> | undefined
): Partial<ExaSearchInput> | undefined => {
  if (!overrides) {
    return undefined;
  }

  const validated: Partial<ExaSearchInput> = { ...overrides };

  if (validated.numResults !== undefined && validated.numResults <= 0) {
    throw new Error(
      "Invalid discovery invocation: numResults must be a positive integer"
    );
  }

  if (validated.maxCharacters !== undefined && validated.maxCharacters <= 0) {
    throw new Error(
      "Invalid discovery invocation: maxCharacters must be a positive integer"
    );
  }

  return validated;
};

/**
 * Resolves the discovery profile from environment defaults and invocation overrides.
 */
const resolveDiscoveryProfile = (
  invocation: DiscoverInvocation
): DiscoveryProfile => {
  const envProfile = loadDiscoveryProfile();

  if (!invocation.profile) {
    return envProfile;
  }

  const overrideProfile: Record<string, string | undefined> = {};

  if (invocation.profile.roleKeywords) {
    overrideProfile.roleKeywords = invocation.profile.roleKeywords.join(",");
  }
  if (invocation.profile.excludedRoleKeywords) {
    overrideProfile.excludedRoleKeywords =
      invocation.profile.excludedRoleKeywords.join(",");
  }
  if (invocation.profile.locationConstraints) {
    overrideProfile.locationConstraints =
      invocation.profile.locationConstraints.join(",");
  }
  if (invocation.profile.companyPreferences) {
    overrideProfile.companyPreferences =
      invocation.profile.companyPreferences.join(",");
  }
  if (invocation.profile.productSurfacePreferences) {
    overrideProfile.productSurfacePreferences =
      invocation.profile.productSurfacePreferences.join(",");
  }
  if (invocation.profile.endToEndOwnership !== undefined) {
    overrideProfile.endToEndOwnership = String(
      invocation.profile.endToEndOwnership
    );
  }
  if (invocation.profile.preferredTechStack) {
    overrideProfile.preferredTechStack =
      invocation.profile.preferredTechStack.join(",");
  }

  const merged: Record<string, string | undefined> = {
    roleKeywords:
      overrideProfile.roleKeywords ?? envProfile.roleKeywords.join(","),
    excludedRoleKeywords:
      overrideProfile.excludedRoleKeywords ??
      envProfile.excludedRoleKeywords.join(","),
    locationConstraints:
      overrideProfile.locationConstraints ??
      envProfile.locationConstraints.join(","),
    companyPreferences:
      overrideProfile.companyPreferences ??
      envProfile.companyPreferences.join(","),
    productSurfacePreferences:
      overrideProfile.productSurfacePreferences ??
      envProfile.productSurfacePreferences.join(","),
    endToEndOwnership:
      overrideProfile.endToEndOwnership ??
      String(envProfile.endToEndOwnership),
    preferredTechStack:
      overrideProfile.preferredTechStack ??
      envProfile.preferredTechStack.join(",")
  };

  return parseDiscoveryProfile(merged);
};

/**
 * Summarizes a resolved profile for safe logging.
 */
const summarizeProfile = (
  profile: DiscoveryProfile
): Record<string, unknown> => ({
  roleKeywordCount: profile.roleKeywords.length,
  excludedRoleKeywordCount: profile.excludedRoleKeywords.length,
  locationConstraintCount: profile.locationConstraints.length,
  companyPreferenceCount: profile.companyPreferences.length,
  hasOwnershipPreference: profile.endToEndOwnership,
  preferredTechStackCount: profile.preferredTechStack.length
});

/**
 * Resolves all run-scoped discovery inputs once before execution.
 */
const createDiscoveryRunContext = async (
  invocation: DiscoverInvocation,
  dependencies: RunDiscoveryDependencies
): Promise<DiscoveryRunContext> => {
  const mode = resolveMode(invocation);

  if (mode !== "discover") {
    return {
      appConfig: dependencies.config,
      invocation,
      logger: dependencies.logger,
      mode
    };
  }

  const discoverConfig = loadDiscoverConfig();
  const titleKeywordFilterConfig = resolveTitleKeywordFilterConfig(invocation);

  const profile = resolveDiscoveryProfile(invocation);
  const { query: generatedQuery } = generateDiscoveryQuery(profile);
  const explicitQueryOverride = validateExplicitQueryOverride(
    invocation.exaSearch?.query
  );
  const tuningOverrides = validateExaTuningOverrides(invocation.exaSearch);

  const querySource = explicitQueryOverride ? "override" : "generated";
  const exaSearchInput = resolveExaInputFromQuery({
    explicitQueryOverride,
    generatedQuery,
    tuningOverrides,
    tuningDefaults: DEFAULT_EXA_TUNING_DEFAULTS
  });

  const exaApiKey = discoverConfig.exaSecretId
    ? await secretsService.getExaApiKey(discoverConfig.exaSecretId)
    : discoverConfig.exaApiKey;

  dependencies.logger.info("discovery_profile_resolved", {
    profile: summarizeProfile(profile),
    querySource
  });

  return {
    appConfig: dependencies.config,
    discoverConfig,
    exaApiKey,
    exaSearchInput,
    invocation,
    logger: dependencies.logger,
    mode,
    titleKeywordFilterConfig
  };
};

/**
 * Executes the smoke-test path used to validate deployments quickly.
 */
const runSmokePath = async (logger: Logger): Promise<DiscoverResult> => {
  logger.info("smoke_path_started");
  logger.info("smoke_log", { value: "hello" });
  await sleep(1_000);
  logger.info("smoke_log", { value: "world" });
  logger.info("smoke_path_completed");

  return {
    message: "ok",
    mode: "smoke"
  };
};

/**
 * Application path for the discovery workflow using profile-first query generation.
 */
const runDiscoveryPath = async (
  context: DiscoveryRunContext
): Promise<DiscoverResult> => {
  const discoverConfig = context.discoverConfig as DiscoverConfig;
  const exaApiKey = context.exaApiKey as string;
  const exaSearchInput = context.exaSearchInput as ExaSearchInput;
  const titleKeywordFilterConfig =
    context.titleKeywordFilterConfig as TitleKeywordFilterConfig;
  const exaSearchAdapter = new ExaSearchAdapter(exaApiKey);

  context.logger.info("discover_path_config_loaded", {
    exaConfigured: Boolean(exaApiKey),
    exaSecretConfigured: Boolean(discoverConfig.exaSecretId)
  });

  context.logger.info("exa_search_request_started", {
    maxCharacters: exaSearchInput.maxCharacters,
    numResults: exaSearchInput.numResults,
    query: exaSearchInput.query,
    type: exaSearchInput.type
  });

  const exaResponse = await exaSearchAdapter.search(exaSearchInput);
  const normalizedResults = exaSearchAdapter.normalizeResults(exaResponse.results);
  const { accepted, companyCandidates, excluded } = runAggregationPipeline(
    normalizedResults,
    [createTitleKeywordFilter(titleKeywordFilterConfig)]
  );

  const excludedResults = excluded
    .slice(0, 3)
    .map((evaluation) => ({
      excludedBy: evaluation.excludedBy,
      reason: evaluation.reason,
      title: evaluation.candidate.title,
      url: evaluation.candidate.url
    }));

  context.logger.info("exa_search_request_completed", {
    resultCount: exaResponse.results.length,
    topResults: normalizedResults.slice(0, 3)
  });

  context.logger.info("title_keyword_filter_completed", {
    excludedCount: excluded.length,
    includeKeywords: titleKeywordFilterConfig.include,
    includedCount: accepted.length,
    excludeKeywords: titleKeywordFilterConfig.exclude,
    includedResults: accepted.slice(0, 3),
    excludedResults
  });

  context.logger.info("company_grouping_completed", {
    companyCandidateCount: companyCandidates.length,
    companyCandidates: companyCandidates.slice(0, 3)
  });

  return {
    message: "discover mode exa search completed",
    mode: "discover"
  };
};

/**
 * Runs the Lambda application for the requested invocation mode.
 */
export const runDiscovery = async (
  invocation: DiscoverInvocation,
  dependencies: RunDiscoveryDependencies
): Promise<DiscoverResult> => {
  const context = await createDiscoveryRunContext(invocation, dependencies);

  context.logger.info("discovery_started", {
    mode: context.mode,
    config: summarizeAppConfig(context.appConfig)
  });

  const result =
    context.mode === "discover"
      ? await runDiscoveryPath(context)
      : await runSmokePath(context.logger);

  context.logger.info("discovery_completed", {
    mode: result.mode,
    config: summarizeAppConfig(context.appConfig)
  });
  return result;
};
