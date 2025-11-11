import pino from 'pino'

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Create pino instance with environment-specific configuration
const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() }
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
        }
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
          ignore: 'pid,hostname',
          sync: true,
        },
      })
    : undefined
)

/**
 * Enhanced logger with context support
 */
export const createLogger = (context: string) => {
  return logger.child({ context })
}

/**
 * Default logger instance
 */
export default logger

/**
 * Log levels helper
 */
export const logLevels = {
  trace: (msg: string, data?: any) => logger.trace(data, msg),
  debug: (msg: string, data?: any) => logger.debug(data, msg),
  info: (msg: string, data?: any) => logger.info(data, msg),
  warn: (msg: string, data?: any) => logger.warn(data, msg),
  error: (msg: string, error?: any) => logger.error(error, msg),
  fatal: (msg: string, error?: any) => logger.fatal(error, msg),
}

/**
 * API request/response logger
 */
export const logRequest = (method: string, path: string, data?: any) => {
  logger.info({ method, path, data }, `${method} ${path}`)
}

export const logResponse = (method: string, path: string, statusCode: number, duration: number) => {
  logger.info({ method, path, statusCode, duration }, `${method} ${path} ${statusCode} (${duration}ms)`)
}

export const logError = (method: string, path: string, error: Error, statusCode = 500) => {
  logger.error({ method, path, error: error.message, statusCode }, `${method} ${path} ERROR`)
}
