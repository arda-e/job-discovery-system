import {
  type AppConfig,
  loadDiscoverConfig,
  summarizeAppConfig
} from "../config/env";
import {
  evaluateCandidates
} from "../domain/filters/pipeline";
import {
  createTitleKeywordFilter,
  DEFAULT_TITLE_KEYWORD_FILTER,
  type TitleKeywordFilterConfig
} from "../domain/filters/title-keyword-filter";
import { getExaApiKeyFromSecret } from "../integrations/aws/secrets";
import {
  normalizeExaResults,
  type ExaSearchInput,
  searchExa
} from "../sources/search/exa";
import type { Logger } from "../util/logger";

export type DiscoverMode = "smoke" | "discover";

export type DiscoverInvocation = {
  exaSearch?: Partial<ExaSearchInput>;
  mode?: DiscoverMode;
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

const EXA_DISCOVER_QUERY =
  "site:jobs.lever.co software engineer remote typescript";

const DEFAULT_EXA_SEARCH_INPUT: ExaSearchInput = {
  query: EXA_DISCOVER_QUERY,
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
 * Resolves Exa search parameters from the invocation event with safe defaults.
 */
const resolveExaSearchInput = (
  invocation: DiscoverInvocation
): ExaSearchInput => ({
  query: invocation.exaSearch?.query ?? DEFAULT_EXA_SEARCH_INPUT.query,
  maxCharacters:
    invocation.exaSearch?.maxCharacters ?? DEFAULT_EXA_SEARCH_INPUT.maxCharacters,
  numResults: invocation.exaSearch?.numResults ?? DEFAULT_EXA_SEARCH_INPUT.numResults,
  type: invocation.exaSearch?.type ?? DEFAULT_EXA_SEARCH_INPUT.type
});

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
 * Placeholder application path for the future discovery workflow.
 */
const runDiscoveryPath = async (
  invocation: DiscoverInvocation,
  logger: Logger
): Promise<DiscoverResult> => {
  const discoverConfig = loadDiscoverConfig();
  const exaSearchInput = resolveExaSearchInput(invocation);
  const titleKeywordFilterConfig = resolveTitleKeywordFilterConfig(invocation);
  const exaApiKey = discoverConfig.exaSecretId
    ? await getExaApiKeyFromSecret(discoverConfig.exaSecretId)
    : discoverConfig.exaApiKey;

  logger.info("discover_path_config_loaded", {
    exaConfigured: Boolean(exaApiKey),
    exaSecretConfigured: Boolean(discoverConfig.exaSecretId)
  });

  logger.info("exa_search_request_started", {
    maxCharacters: exaSearchInput.maxCharacters,
    numResults: exaSearchInput.numResults,
    query: exaSearchInput.query,
    type: exaSearchInput.type
  });

  const exaResponse = await searchExa(exaApiKey as string, exaSearchInput);

  const normalizedResults = normalizeExaResults(exaResponse.results);
  const evaluations = evaluateCandidates(normalizedResults, [
    createTitleKeywordFilter(titleKeywordFilterConfig)
  ]);
  const includedResults = evaluations
    .filter((evaluation) => evaluation.accepted)
    .map((evaluation) => evaluation.candidate);
  const excludedResults = evaluations
    .filter((evaluation) => !evaluation.accepted)
    .slice(0, 3)
    .map((evaluation) => ({
      excludedBy: evaluation.excludedBy,
      reason: evaluation.reason,
      title: evaluation.candidate.title,
      url: evaluation.candidate.url
    }));

  logger.info("exa_search_request_completed", {
    resultCount: exaResponse.results.length,
    topResults: normalizedResults.slice(0, 3)
  });

  logger.info("title_keyword_filter_completed", {
    excludedCount: evaluations.length - includedResults.length,
    includeKeywords: titleKeywordFilterConfig.include,
    includedCount: includedResults.length,
    excludeKeywords: titleKeywordFilterConfig.exclude,
    includedResults: includedResults.slice(0, 3),
    excludedResults
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
  const mode = resolveMode(invocation);
  dependencies.logger.info("discovery_started", {
    mode,
    config: summarizeAppConfig(dependencies.config)
  });

  const result =
    mode === "discover"
      ? await runDiscoveryPath(invocation, dependencies.logger)
      : await runSmokePath(dependencies.logger);

  dependencies.logger.info("discovery_completed", {
    mode: result.mode,
    config: summarizeAppConfig(dependencies.config)
  });
  return result;
};
