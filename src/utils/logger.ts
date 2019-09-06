import * as colors from 'colors'
import * as winston from 'winston'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const consoleTransport = new winston.transports.Console({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.label({ label: colors.magenta('percy') }),
    winston.format.printf(({ label, message }) => `[${label}] ${message}`),
  ),
})

const logger = winston.createLogger({
  transports: [consoleTransport],
})

export function profile(id: string, meta?: any): winston.Logger | undefined {
  if (LOG_LEVEL === 'debug') {
    return logger.profile(id, { level: 'debug', ...meta })
  }
}

export function logError(error: any) {
  logger.error(`${error.name} ${error.message}`)
  logger.debug(error)
}

export function createFileLogger(filename: string) {
  const fileTransport = new winston.transports.File({ filename, level: 'debug' })
  return winston.createLogger({ transports: [consoleTransport, fileTransport] })
}

export default logger
