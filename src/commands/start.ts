import {flags} from '@oclif/command'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class Start extends PercyCommand {
  static description = 'Starts the percy-agent process.'
  // static hidden = false

  static examples = [
    '$ percy-agent start\n' +
    'info: percy-agent has started on port 5338. Logs available at log/percy-agent.log',
  ]

  static flags = {
    port: flags.integer({
      char: 'p',
      description: 'port',
      default: 5338,
    }),
    detached: flags.boolean({
      char: 'd',
      description: 'start as a detached process',
    })
  }

  async run() {
    const {flags} = this.parse(Start)
    let port = flags.port as number

    if (this.percyEnvVarsMissing()) { return }

    if (flags.detached) {
      await this.runDetached(port)
    } else {
      await this.runAttached(port)
    }

    await healthCheck(port)
  }

  private async runAttached(port: number) {
    process.on('SIGHUP', async () => {
      await this.agentService.stop()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      await this.agentService.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await this.agentService.stop()
      process.exit(0)
    })

    await this.agentService.start(port)
    this.logStart(port)
  }

  private async runDetached(port: number) {
    const pid = await this.processService.runDetached(
      ['bin/run', 'start', '--port', String(port)]
    )

    if (pid) {
      this.logStart(port)
    } else {
      this.logger.warn('percy-agent is already running')
    }
  }

  private logStart(port: number) {
    this.logger.info(`percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
  }
}
