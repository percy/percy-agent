import { flags } from '@oclif/command'
import * as path from 'path'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import config from '../utils/configuration'
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
    'allowed-hostname': flags.string({
      char: 'h',
      description: 'Allowable hostname(s) to capture assets from',
      multiple: true,
    }),
    'network-idle-timeout': flags.integer({
      char: 't',
      description: [
        `[default: ${DEFAULT_CONFIGURATION.agent['asset-discovery']['network-idle-timeout']}]`,
        'Asset discovery network idle timeout (in milliseconds)',
      ].join(' '),
    }),
    'port': flags.integer({
      char: 'p',
      description: [
        `[default: ${DEFAULT_CONFIGURATION.agent.port}]`,
        'Port',
      ].join(' '),
    }),
    'config': flags.string({
      char: 'c',
      description: 'Path to percy config file',
    }),
  }

  async run() {
    await super.run()

    // If Percy is disabled or is missing a token, gracefully exit here
    if (!this.percyWillRun()) { this.exit(0) }

    const { flags } = this.parse(Start)

    if (flags.detached) {
      this.runDetached(flags)
    } else {
      await this.start(config(flags))
    }

    await healthCheck(flags.port!)
  }

  async stop(exitCode?: any, stopProcess?: boolean) {
    this.processService.cleanup()
    await super.stop(exitCode, stopProcess)
  }

  private runDetached(flags: any) {
    let args: string[] = []

    if (flags.port) {
      args = args.concat('-p', flags.port)
    }

    if (flags['network-idle-timeout']) {
      args = args.concat('-t', flags['network-idle-timeout'])
    }

    const pid = this.processService.runDetached([
      path.resolve(`${__dirname}/../../bin/run`),
      'start',
      ...args,
    ])

    if (pid) {
      this.logStart()
    } else {
      this.logger.warn('percy is already running')
    }
  }
}
