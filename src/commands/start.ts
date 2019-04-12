import {flags} from '@oclif/command'
import * as path from 'path'
import {AgentOptions} from '../services/agent-options'
import Constants from '../services/constants'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class Start extends PercyCommand {
  static description = 'Starts the percy process.'
  static hidden = true

  static examples = [
    '$ percy start\n' +
    `info: percy has started on port ${Constants.PORT}.`,
  ]

  static flags = {
    'detached': flags.boolean({
      char: 'd',
      description: 'start as a detached process',
    }),
    'network-idle-timeout': flags.integer({
      char: 't',
      default: Constants.NETWORK_IDLE_TIMEOUT,
      description: 'asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: Constants.PORT,
      description: 'port',
    }),
  }

  async run() {
    await super.run()

    // If Percy is disabled or is missing a token, gracefully exit here
    if (!this.percyWillRun()) { this.exit(0) }

    const {flags} = this.parse(Start)
    const port = flags.port as number
    const networkIdleTimeout = flags['network-idle-timeout'] as number

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
        '-t', String(options.networkIdleTimeout),
      ],
    )

    if (pid) {
      this.logStart()
    } else {
      this.logger.warn('percy is already running')
    }
  }
}
