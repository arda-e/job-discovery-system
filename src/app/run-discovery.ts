import {
  type AppConfig,
  type DiscoverConfig,
  loadDiscoverConfig,
  summarizeAppConfig
} from "../config/env";
import {
  createTitleKeywordFilter,
  DEFAULT_TITLE_KEYWORD_FILTER,
  type TitleKeywordFilterConfig
} from "../domain/filters/title-keyword-filter";
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
  const exaSearchInput = resolveExaSearchInput(invocation);
  const titleKeywordFilterConfig = resolveTitleKeywordFilterConfig(invocation);
  const exaApiKey = discoverConfig.exaSecretId
    ? await secretsService.getExaApiKey(discoverConfig.exaSecretId)
    : discoverConfig.exaApiKey;

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
 * Placeholder application path for the future discovery workflow.
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
