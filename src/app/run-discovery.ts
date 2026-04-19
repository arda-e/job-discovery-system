import {
  loadAppConfig,
  summarizeAppConfig
} from "../config/env";
import type { Logger } from "../util/logger";

export type DiscoverMode = "smoke" | "discover";

export type DiscoverInvocation = {
  mode?: DiscoverMode;
};

export type DiscoverResult = {
  message: string;
  mode: DiscoverMode;
};

export type RunDiscoveryDependencies = {
  logger: Logger;
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
const runDiscoveryPath = async (logger: Logger): Promise<DiscoverResult> => {
  logger.info("discover_path_not_implemented");

  return {
    message: "discovery path not implemented",
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
  const config = loadAppConfig();
  dependencies.logger.info("discovery_started", {
    mode,
    config: summarizeAppConfig(config)
  });

  const result =
    mode === "discover"
      ? await runDiscoveryPath(dependencies.logger)
      : await runSmokePath(dependencies.logger);

  dependencies.logger.info("discovery_completed", {
    mode: result.mode,
    config: summarizeAppConfig(config)
  });
  return result;
};
