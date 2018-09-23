import * as winston from 'winston'
import * as colors from 'colors'

let logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: (process.env.LOG_LEVEL || 'info'),
      showLevel: false,
      label: colors.magenta('percy'),
    })
  ]
})

export function profile(
  id: string, meta?: any,
  callback?: (err: Error, level: string, msg: string, meta: any) => void
): winston.LoggerInstance | undefined {
  if (process.env.LOG_LEVEL === 'debug') {
    return logger.profile(id, id, meta, callback)
  }
}

export function logError(error: any) {
  logger.error(`${error.name} ${error.message}`)
  logger.debug(error)
}

export default logger
