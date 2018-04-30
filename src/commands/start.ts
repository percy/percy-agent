import {Command, flags} from '@oclif/command'
import AgentService from '../services/agent-service'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'
import healthCheck from '../utils/health-checker'

export default class Start extends Command {
  static description = 'Starts the percy-agent process.'

  static examples = [
    '$ percy-agent start\n' +
    'info: percy-agent has started on port 5338. Logs available at log/percy-agent.log',
  ]

  static flags = {
    port: flags.string({
      char: 'p',
      description: 'port',
      default: '5338',
    }),
    attached: flags.boolean({
      char: 'a',
      description: 'start as an attached process',
    })
  }

  async run() {
    const {flags} = this.parse(Start)
    const port = flags.port ? parseInt(flags.port) : 5338

    if (flags.attached) {
      await this.runAttached(port)
    } else {
      await this.runDetached(port)
    }

    await healthCheck(port)
  }

  private async runAttached(port: number) {
    let agentService = new AgentService()

    process.on('SIGINT', () => agentService.stop())

    await agentService.start(port)
    this.logStart(port)
  }

  private async runDetached(port: number) {
    let processService = new ProcessService()

    const pid = await processService.runDetached(
      ['bin/run', 'start', '--attached', '--port', String(port)]
    )

    if (pid) {
      this.logStart(port)
    } else {
      logger.warn('percy-agent is already running')
    }
  }

  private logStart(port: number) {
    logger.info(`percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
  }
}
