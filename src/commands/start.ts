import {flags} from '@oclif/command'
import AgentService from '../services/agent-service'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class Start extends PercyCommand {
  static description = 'Starts the percy-agent process.'
  static hidden = false

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
    attached: flags.boolean({
      char: 'a',
      description: 'start as an attached process',
    })
  }

  async run() {
    const {flags} = this.parse(Start)
    let port = flags.port as number

    if (this.percyEnvVarsMissing()) { return }

    if (flags.attached) {
      await this.runAttached(port)
    } else {
      await this.runDetached(port)
    }

    await healthCheck(port)
  }

  private async runAttached(port: number) {
    let agentService = new AgentService()

    process.on('SIGHUP', async () => {
      await agentService.stop()
      process.exit(0)
    })
    process.on('SIGINT', async () => {
      await agentService.stop()
      process.exit(0)
    })
    process.on('SIGTERM', async () => {
      await agentService.stop()
      process.exit(0)
    })

    await agentService.start(port)
    this.logStart(port)
  }

  private async runDetached(port: number) {
    let processService = this.processService()

    const pid = await processService.runDetached(
      ['bin/run', 'start', '--attached', '--port', String(port)]
    )

    if (pid) {
      this.logStart(port)
    } else {
      this.logger().warn('percy-agent is already running')
    }
  }

  private logStart(port: number) {
    this.logger().info(`percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
  }
}
