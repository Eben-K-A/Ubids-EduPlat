import { LoggerService } from "@nestjs/common";
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, singleLine: true }
      }
});

export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    baseLogger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    baseLogger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    baseLogger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    baseLogger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    baseLogger.trace({ context }, message);
  }
}

export function getLogger() {
  return baseLogger;
}
