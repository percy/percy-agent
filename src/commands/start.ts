import {flags} from '@oclif/command'
import * as path from 'path'
import {AgentConfiguration} from '../configuration/agent-configuration'
import {DEFAULT_PORT} from '../services/agent-service-constants'
import {DEFAULT_NETWORK_IDLE_TIMEOUT} from '../services/asset-discovery-service'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class Start extends PercyCommand {
  static description = 'Starts the percy process.'
  static hidden = true

  static examples = [
    '$ percy start\n' +
    `info: percy has started on port ${DEFAULT_PORT}.`,
  ]

  static flags = {
    'detached': flags.boolean({
      char: 'd',
      description: 'start as a detached process',
    }),
    'network-idle-timeout': flags.integer({
      char: 't',
      default: DEFAULT_NETWORK_IDLE_TIMEOUT,
      description: 'asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: DEFAULT_PORT,
      description: 'port',
    }),
  }

  async run() {
    await super.run()

    // If Percy is disabled or is missing a token, gracefully exit here
    if (!this.percyWillRun()) { this.exit(0) }

    const {flags} = this.parse(Start)
    const configuration: AgentConfiguration = {
      'port': flags.port,
      'asset-discovery': {
        'network-idle-timeout': flags['network-idle-timeout'],
      },
    }

    if (flags.detached) {
      this.runDetached(configuration)
    } else {
      await this.runAttached(configuration)
    }

    await healthCheck(flags.port || DEFAULT_PORT)
  }

  private async runAttached(configuration: AgentConfiguration = {}) {
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

    await this.agentService.start(configuration)
    this.logStart()
  }

  private runDetached(configuration: AgentConfiguration = {}) {
    const pid = this.processService.runDetached(
      [
        path.resolve(`${__dirname}/../../bin/run`),
        'start',
        '-p', String(configuration.port),
        '-t', String(configuration['asset-discovery']!['network-idle-timeout']),
      ],
    )

    if (pid) {
      this.logStart()
    } else {
      this.logger.warn('percy is already running')
    }
  }
}
