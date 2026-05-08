import * as Sentry from "@sentry/nextjs";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "production") {
    return level === "error" || level === "warn";
  }
  return true;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  error(message: string, error?: Error, context?: LogContext) {
    if (!shouldLog("error")) return;
    console.error(formatMessage("error", message, context), error);
    if (error) {
      Sentry.captureException(error, { extra: context });
    }
  },

  warn(message: string, context?: LogContext) {
    if (!shouldLog("warn")) return;
    console.warn(formatMessage("warn", message, context));
  },

  info(message: string, context?: LogContext) {
    if (!shouldLog("info")) return;
    console.info(formatMessage("info", message, context));
  },

  debug(message: string, context?: LogContext) {
    if (!shouldLog("debug")) return;
    console.debug(formatMessage("debug", message, context));
  },
};
