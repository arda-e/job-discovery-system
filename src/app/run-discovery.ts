export type DiscoverMode = "smoke" | "discover";

export type DiscoverInvocation = {
  mode?: DiscoverMode;
};

export type DiscoverResult = {
  message: string;
  mode: DiscoverMode;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const resolveMode = (invocation: DiscoverInvocation): DiscoverMode =>
  invocation.mode ?? "smoke";

const runSmokePath = async (): Promise<DiscoverResult> => {
  console.log("hello");
  await sleep(1_000);
  console.log("world");

  return {
    message: "ok",
    mode: "smoke"
  };
};

const runDiscoveryPath = async (): Promise<DiscoverResult> => {
  console.log("discovery path is not implemented yet");

  return {
    message: "discovery path not implemented",
    mode: "discover"
  };
};

export const runDiscovery = async (
  invocation: DiscoverInvocation
): Promise<DiscoverResult> => {
  const mode = resolveMode(invocation);
  console.log("starting discovery invocation", { mode });

  const result =
    mode === "discover" ? await runDiscoveryPath() : await runSmokePath();

  console.log("completed discovery invocation", { mode: result.mode });
  return result;
};
