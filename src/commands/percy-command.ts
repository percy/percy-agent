import {Command} from '@oclif/command'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'
import * as winston from 'winston'

export default class PercyCommand extends Command {
  static hidden = true

  processService(): ProcessService {
    return new ProcessService()
  }

  logger(): winston.LoggerInstance {
    return logger
  }

  async run() {
    throw('Implement run() in subclass')
  }

  protected percyEnvVarsMissing(): boolean {
    if (process.env.PERCY_TOKEN === '') {
      this.logMissingEnvVar('PERCY_TOKEN')
      return true
    }

    if (process.env.PERCY_PROJECT === '') {
      this.logMissingEnvVar('PERCY_PROJECT')
      return true
    }

    return false
  }

  private logMissingEnvVar(name: string) {
    this.logger().error(
      `You must set ${name} to start percy-agent. See https://percy.io/docs for how to set ${name} for your environment.`
    )
  }
}
