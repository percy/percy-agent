import {flags} from '@oclif/command'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

const path = require('path')

export default class Start extends PercyCommand {
  static description = 'Starts the percy-agent process.'
  static hidden = true

  static examples = [
    '$ percy-agent start\n' +
    'info: percy-agent has started on port 5338.',
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
      this.runDetached(port)
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

  private runDetached(port: number) {
    const pid = this.processService.runDetached(
      [path.resolve(`${__dirname}/../../bin/run`), 'start', '--port', String(port)]
    )

    if (pid) {
      this.logStart(port)
    } else {
      this.logger.warn('percy-agent is already running')
    }
  }
}
