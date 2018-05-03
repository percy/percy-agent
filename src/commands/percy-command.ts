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

  percyToken(): string | undefined {
    return process.env.PERCY_TOKEN
  }

  percyProject(): string | undefined {
    return process.env.PERCY_PROJECT
  }

  async run() {
    throw('Implement run() in subclass')
  }

  protected percyEnvVarsMissing(): boolean {
    if (this.percyToken() === '' || this.percyToken() === undefined) {
      this.logMissingEnvVar('PERCY_TOKEN')
      return true
    }

    if (this.percyProject() === '' || this.percyProject() === undefined) {
      this.logMissingEnvVar('PERCY_PROJECT')
      return true
    }

    return false
  }

  private logMissingEnvVar(name: string) {
    this.logger().error(
      `You must set ${name}. See https://percy.io/docs for how to set ${name} for your environment.`
    )
  }
}
