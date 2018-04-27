import * as winston from 'winston'

process.env

let logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
    }),
    new winston.transports.File({
      level: (process.env.LOG_LEVEL || 'info'), filename: 'log/percy-agent.log', colorize: true, json: false
    })
  ]
})

export default logger
