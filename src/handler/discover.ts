import type { Context, Handler } from "aws-lambda";
import { loadAppConfig } from "../config/env";
import {
  runDiscovery,
  type DiscoverInvocation
} from "../app/run-discovery";
import { createLogger } from "../util/logger";

/**
 * Lambda entrypoint for discovery invocations.
 */
export const handler: Handler<DiscoverInvocation> = async (
  event = {},
  context: Context
) => {
  const config = loadAppConfig();
  const startedAt = Date.now();
  const mode = event.mode ?? "smoke";
  const logger = createLogger({
    awsRequestId: context.awsRequestId,
    appEnv: config.appEnv,
    logLevel: config.logLevel,
    mode
  });

  logger.info("invocation_started");

  try {
    const result = await runDiscovery(event, { config, logger });
    logger.info("invocation_completed", {
      durationMs: Date.now() - startedAt,
      result: result.message
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: config.appEnv === "prod" ? undefined : error.stack
          }
        : {
            errorName: "UnknownError",
            errorMessage: "Non-Error value thrown"
          };

    logger.error("invocation_failed", {
      durationMs: Date.now() - startedAt,
      ...normalizedError
    });

    throw error;
  }
};
