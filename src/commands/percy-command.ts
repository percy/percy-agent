import {Command} from '@oclif/command'
import * as winston from 'winston'
import {AgentService} from '../services/agent-service'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'

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
    if (this.percyEnabled && !this.percyTokenPresent()) {
      this.warn('Skipping visual tests. PERCY_TOKEN was not provided.')
    }
  }

  percyEnabled(): boolean {
    return process.env.PERCY_ENABLE !== '0'
  }

  percyWillRun(): boolean {
    return (this.percyEnabled() && this.percyTokenPresent())
  }

  percyTokenPresent(): boolean {
    return this.percyToken.trim() !== ''
  }

  logStart() {
    this.logger.info('percy has started.')
  }
}
