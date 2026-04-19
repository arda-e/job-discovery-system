export type AppEnv = "dev" | "prod";
export type LogLevel = "debug" | "info" | "warn" | "error";

export type RawEnv = {
  APP_ENV?: string;
  EXA_API_KEY?: string;
  EXA_SECRET_ID?: string;
  LOG_LEVEL?: string;
};

export type AppConfig = {
  appEnv: AppEnv;
  logLevel: LogLevel;
};

export type DiscoverConfig = {
  exaApiKey?: string;
  exaSecretId?: string;
};

const APP_ENVS: AppEnv[] = ["dev", "prod"];
const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

/**
 * Parses a string environment variable into one of the allowed literal values.
 */
const parseEnum = <T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: T,
  key: string
): T => {
  if (value === undefined) {
    return fallback;
  }

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  throw new Error(
    `Invalid ${key}: expected one of ${allowedValues.join(", ")}, received ${value}`
  );
};

/**
 * Loads the Lambda runtime configuration from environment variables.
 */
export const loadAppConfig = (env: RawEnv = process.env): AppConfig => ({
  appEnv: parseEnum(env.APP_ENV, APP_ENVS, "dev", "APP_ENV"),
  logLevel: parseEnum(env.LOG_LEVEL, LOG_LEVELS, "info", "LOG_LEVEL")
});

/**
 * Returns a log-safe subset of runtime configuration fields.
 */
export const summarizeAppConfig = (config: AppConfig): Record<string, string> => ({
  appEnv: config.appEnv,
  logLevel: config.logLevel
});

/**
 * Loads discover-mode configuration and fails fast when required values are missing.
 */
export const loadDiscoverConfig = (
  env: RawEnv = process.env
): DiscoverConfig => {
  if (!env.EXA_SECRET_ID && !env.EXA_API_KEY) {
    throw new Error(
      "Missing discover credentials: set EXA_SECRET_ID or EXA_API_KEY"
    );
  }

  return {
    exaApiKey: env.EXA_API_KEY,
    exaSecretId: env.EXA_SECRET_ID
  };
};
