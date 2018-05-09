import * as winston from 'winston'

process.env

let logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: (process.env.LOG_LEVEL || 'info')
    }),
    new winston.transports.File({
      level: (process.env.LOG_LEVEL || 'info'), filename: 'log/percy-agent.log', colorize: true, json: false
    })
  ]
})

export function logError(error: any) {
  logger.error(`${error.name} ${error.message}`)
  logger.debug(error)
}

export default logger
