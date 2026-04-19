import type { AppEnv, LogLevel } from "../config/env";

export type LogMeta = Record<string, unknown>;

export type LoggerContext = {
  awsRequestId?: string;
  appEnv: AppEnv;
  logLevel: LogLevel;
  mode?: string;
};

export type Logger = {
  debug: (event: string, meta?: LogMeta) => void;
  info: (event: string, meta?: LogMeta) => void;
  warn: (event: string, meta?: LogMeta) => void;
  error: (event: string, meta?: LogMeta) => void;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

/**
 * Creates a context-bound JSON logger for Lambda invocations.
 */
export const createLogger = (context: LoggerContext): Logger => {
  /**
   * Returns true when the requested level should be emitted.
   */
  const shouldLog = (level: LogLevel): boolean =>
    LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[context.logLevel];

  /**
   * Formats and writes one structured log event.
   */
  const write = (level: LogLevel, event: string, meta: LogMeta = {}): void => {
    if (!shouldLog(level)) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...context,
      ...meta
    };

    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  };

  return {
    debug: (event, meta) => write("debug", event, meta),
    info: (event, meta) => write("info", event, meta),
    warn: (event, meta) => write("warn", event, meta),
    error: (event, meta) => write("error", event, meta)
  };
};
