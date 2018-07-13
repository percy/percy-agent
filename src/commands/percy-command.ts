import {Command} from '@oclif/command'
import logger from '../utils/logger'
import AgentService from '../services/agent-service'
import ProcessService from '../services/process-service'
import * as winston from 'winston'

export default class PercyCommand extends Command {
  // static hidden = true

  agentService: AgentService
  processService: ProcessService
  logger: winston.LoggerInstance
  percyToken: string
  percyProject: string

  constructor(argv: string[], config: any) {
    super(argv, config)

    this.agentService = new AgentService()
    this.processService = new ProcessService()
    this.logger = logger
    this.percyToken = process.env.PERCY_TOKEN || ''
    this.percyProject = process.env.PERCY_PROJECT || ''
  }

  async run() {
    throw('Implement run() in subclass')
  }

  percyEnvVarsMissing(): boolean {
    if (this.percyToken === '') {
      this.logMissingEnvVar('PERCY_TOKEN')
      return true
    } else if (this.percyProject === '') {
      this.logMissingEnvVar('PERCY_PROJECT')
      return true
    }

    return false
  }

  private logMissingEnvVar(name: string) {
    this.logger.error(
      `You must set ${name}. See https://percy.io/docs for how to set ${name} for your environment.`
    )
  }
}
