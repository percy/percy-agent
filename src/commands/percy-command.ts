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
    if (this.percyEnabled && !this.percyTokenPresent()) {
      this.warn('Skipping visual tests. You must set PERCY_TOKEN')
    }
  }

  percyEnabled(): boolean {
    return process.env.PERCY_ENABLE !== '0'
  }

  percyWillRun(): boolean {
    return (this.percyEnabled() && this.percyTokenPresent())
  }

  percyTokenPresent(): boolean {
    return this.percyToken !== ''
  }

  logStart() {
    this.logger.info('percy has started.')
  }
}
