import {flags} from '@oclif/command'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'
import {AgentOptions} from '../services/agent-options'

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
    'network-idle-timeout': flags.integer({
      char: 't',
      description: 'asset discovery network idle timeout (in milliseconds)',
      default: 50,
    }),
    detached: flags.boolean({
      char: 'd',
      description: 'start as a detached process',
    })
  }

  async run() {
    const {flags} = this.parse(Start)
    let port = flags.port as number
    let networkIdleTimeout = flags['network-idle-timeout'] as number

    if (this.percyEnvVarsMissing()) { return }

    if (flags.detached) {
      this.runDetached({port, networkIdleTimeout})
    } else {
      await this.runAttached({port, networkIdleTimeout})
    }

    await healthCheck(port)
  }

  private async runAttached(options: AgentOptions = {}) {
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

    await this.agentService.start(options)
    this.logStart()
  }

  private runDetached(options: AgentOptions = {}) {
    const pid = this.processService.runDetached(
      [
        path.resolve(`${__dirname}/../../bin/run`),
        'start',
        '-p', String(options.port),
        '-t', String(options.networkIdleTimeout)
      ]
    )

    if (pid) {
      this.logStart()
    } else {
      this.logger.warn('percy-agent is already running')
    }
  }
}
