import * as colors from 'colors'
import * as winston from 'winston'

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: (process.env.LOG_LEVEL || 'info'),
      showLevel: false,
      label: colors.magenta('percy'),
    }),
  ],
})

export function profile(
  id: string, meta?: any,
  callback?: (err: Error, level: string, msg: string, meta: any) => void,
): winston.LoggerInstance | undefined {
  if (process.env.LOG_LEVEL === 'debug') {
    // Only pass the callback through if it is defined, because the winston.Logger implementation
    // does not behave as expected if you pass a null callback (it will ignore the meta parameter).
    if (callback) {
      return logger.profile(id, id, meta, callback)
    } else {
      return logger.profile(id, id, meta)
    }
  }
}

export function logError(error: any) {
  logger.error(`${error.name} ${error.message}`)
  logger.debug(error)
}

export default logger
