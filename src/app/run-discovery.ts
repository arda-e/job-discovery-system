import {
  loadAppConfig,
  summarizeAppConfig
} from "../config/env";

export type DiscoverMode = "smoke" | "discover";

export type DiscoverInvocation = {
  mode?: DiscoverMode;
};

export type DiscoverResult = {
  message: string;
  mode: DiscoverMode;
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
const runSmokePath = async (): Promise<DiscoverResult> => {
  console.log("hello");
  await sleep(1_000);
  console.log("world");

  return {
    message: "ok",
    mode: "smoke"
  };
};

/**
 * Placeholder application path for the future discovery workflow.
 */
const runDiscoveryPath = async (): Promise<DiscoverResult> => {
  console.log("discovery path is not implemented yet");

  return {
    message: "discovery path not implemented",
    mode: "discover"
  };
};

/**
 * Runs the Lambda application for the requested invocation mode.
 */
export const runDiscovery = async (
  invocation: DiscoverInvocation
): Promise<DiscoverResult> => {
  const mode = resolveMode(invocation);
  const config = loadAppConfig();
  console.log("starting discovery invocation", {
    mode,
    config: summarizeAppConfig(config)
  });

  const result =
    mode === "discover" ? await runDiscoveryPath() : await runSmokePath();

  console.log("completed discovery invocation", {
    mode: result.mode,
    config: summarizeAppConfig(config)
  });
  return result;
};
