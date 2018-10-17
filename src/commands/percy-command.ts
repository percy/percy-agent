import {Command} from '@oclif/command'
import logger from '../utils/logger'
import AgentService from '../services/agent-service'
import ProcessService from '../services/process-service'
import * as winston from 'winston'

export default class PercyCommand extends Command {
  static hidden = true

  agentService: AgentService
  processService: ProcessService
  logger: winston.LoggerInstance
  percyToken: string

  constructor(argv: string[], config: any) {
    super(argv, config)

    this.agentService = new AgentService()
    this.processService = new ProcessService()
    this.logger = logger
    this.percyToken = process.env.PERCY_TOKEN || ''
  }

  async run() {
    if (!this.percyEnabled()) {
      this.exit(0)
    }

    if (this.percyEnvVarsMissing()) {
      this.exit(1)
    }
  }

  percyEnabled(): boolean {
    return process.env.PERCY_ENABLE !== '0'
  }

  percyEnvVarsMissing(): boolean {
    if (this.percyToken === '') {
      this.logMissingEnvVar('PERCY_TOKEN')
      return true
    }

    return false
  }

  logStart() {
    this.logger.info('percy has started.')
  }

  logMissingEnvVar(name: string) {
    this.error(`You must set ${name}`, {exit: 1})
  }
}
