import { Command } from '@oclif/command'
import * as winston from 'winston'
import { Configuration } from '../configuration/configuration'
import { AgentService } from '../services/agent-service'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'

export default class PercyCommand extends Command {
  static hidden = true

  agentService: AgentService
  processService: ProcessService
  logger: winston.Logger
  percyToken: string

  // helps prevent exiting before the agent service has stopped
  private exiting = false

  constructor(argv: string[], config: any) {
    super(argv, config)

    this.agentService = new AgentService()
    this.processService = new ProcessService()
    this.logger = logger
    this.percyToken = process.env.PERCY_TOKEN || ''
  }

  async run() {
    if (this.percyEnabled() && !this.percyTokenPresent()) {
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

  async start(configuration: Configuration) {
    if (this.percyWillRun()) {
      await this.agentService.start(configuration)
      this.logStart()

      // Receiving any of these events should stop the agent and exit
      process.on('SIGHUP', () => this.stop(0, true))
      process.on('SIGINT', () => this.stop(0, true))
      process.on('SIGTERM', () => this.stop(0, true))
    }
  }

  async stop(exitCode?: number | null, stopProcess?: boolean) {
    if (this.exiting) { return }
    this.exiting = true

    if (this.percyWillRun()) {
      await this.agentService.stop()
    }

    if (stopProcess) {
      process.exit(exitCode || 0)
    } else {
      this.exit(exitCode || 0)
    }
  }
}
