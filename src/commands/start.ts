import {flags} from '@oclif/command'
import * as path from 'path'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import ConfigurationService from '../services/configuration-service'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class Start extends PercyCommand {
  static description = 'Starts the percy process.'
  static hidden = true

  static examples = [
    '$ percy start\n' +
    `info: percy has started on port ${DEFAULT_CONFIGURATION.agent.port}.`,
  ]

  static flags = {
    'detached': flags.boolean({
      char: 'd',
      description: 'start as a detached process',
    }),
    'network-idle-timeout': flags.integer({
      char: 't',
      default: DEFAULT_CONFIGURATION.agent['asset-discovery']['network-idle-timeout'],
      description: 'asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: DEFAULT_CONFIGURATION.agent.port,
      description: 'port',
    }),
  }

  async run() {
    await super.run()

    // If Percy is disabled or is missing a token, gracefully exit here
    if (!this.percyWillRun()) { this.exit(0) }

    const {flags} = this.parse(Start)

    if (flags.detached) {
      this.runDetached()
    } else {
      await this.runAttached()
    }

    await healthCheck(flags.port!)
  }

  private async runAttached() {
    const {flags} = this.parse(Start)

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

    const configuration = new ConfigurationService().applyFlags(flags)
    await this.agentService.start(configuration)
    this.logStart()
  }

  private runDetached() {
    const {flags} = this.parse(Start)

    const pid = this.processService.runDetached(
      [
        path.resolve(`${__dirname}/../../bin/run`),
        'start',
        '-p', String(flags.port!),
        '-t', String(flags['network-idle-timeout']),
      ],
    )

    if (pid) {
      this.logStart()
    } else {
      this.logger.warn('percy is already running')
    }
  }
}
