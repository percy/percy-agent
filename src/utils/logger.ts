import * as colors from 'colors'
import * as winston from 'winston'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

export function addLogDate(log: string) {
  return `${log} | ${new Date().toString()}`
}

function createConsoleTransport() {
  return new winston.transports.Console({
    level: LOG_LEVEL,
    stderrLevels: ['error'],
    format: winston.format.combine(
      winston.format.label({ label: colors.magenta('percy') }),
      winston.format.printf(({ label, message }) => `[${label}] ${message}`),
    ),
  })
}

const logger = winston.createLogger({
  transports: [createConsoleTransport()],
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
  return winston.createLogger({ transports: [createConsoleTransport(), fileTransport] })
}

export default logger
