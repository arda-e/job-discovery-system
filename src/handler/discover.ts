import type { Handler } from "aws-lambda";
import {
  runDiscovery,
  type DiscoverInvocation
} from "../app/run-discovery";

/**
 * Lambda entrypoint for discovery invocations.
 */
export const handler: Handler<DiscoverInvocation> = async (event = {}) => {
  const result = await runDiscovery(event);

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
