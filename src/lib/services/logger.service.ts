/**
 * Structured Logger Service
 * Provides centralized logging with Winston, persistent file storage,
 * and audit trail for all data persistence operations
 */

import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for structured logging
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

/**
 * Logger instances for different concerns
 */
export const Logger = {
  /**
   * General application logger
   */
  app: winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: structuredFormat,
    defaultMeta: { service: "liquor-club-app" },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "app.log"),
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      }),
    ],
  }),

  /**
   * Transaction-specific logger
   */
  transaction: winston.createLogger({
    level: "info",
    format: structuredFormat,
    defaultMeta: { service: "transactions" },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "transactions.log"),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 10,
      }),
    ],
  }),

  /**
   * Audit logger - logs all data modifications
   */
  audit: winston.createLogger({
    level: "info",
    format: structuredFormat,
    defaultMeta: { service: "audit" },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, "audit.log"),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
      }),
    ],
  }),

  /**
   * Error logger - dedicated to errors
   */
  error: winston.createLogger({
    level: "error",
    format: structuredFormat,
    defaultMeta: { service: "errors" },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "errors.log"),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 10,
      }),
    ],
  }),

  /**
   * Datastore/Persistence layer logger
   */
  datastore: winston.createLogger({
    level: "debug",
    format: structuredFormat,
    defaultMeta: { service: "datastore" },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === "development" ? "debug" : "info",
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "datastore.log"),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
    ],
  }),
};

/**
 * Helper to log transaction events
 */
export function logTransaction(event: string, data: Record<string, any>) {
  Logger.transaction.info(event, {
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Helper to log audit events
 */
export function logAudit(action: string, userId: string, details: Record<string, any>) {
  Logger.audit.info(action, {
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Helper to log database operations
 */
export function logDatastore(operation: string, collection: string, data?: Record<string, any>) {
  Logger.datastore.debug(operation, {
    collection,
    ...(data || {}),
  });
}

export default Logger;
