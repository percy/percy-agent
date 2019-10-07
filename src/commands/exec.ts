import { flags } from '@oclif/command'
import * as spawn from 'cross-spawn'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import config from '../utils/configuration'
import PercyCommand from './percy-command'

export default class Exec extends PercyCommand {
  static description = 'Start and stop Percy around a supplied command.'
  static hidden = false
  static strict = false

  static examples = [
    '$ percy exec -- echo \"percy is running around this echo command\"',
    '$ percy exec -- bash -c "echo foo && echo bar"',
  ]

  static flags = {
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

    const { argv, flags } = this.parse(Exec)
    const command = argv.shift()

    if (!command) {
      this.logger.info('You must supply a command to run after --')
      this.logger.info('Example:')
      this.logger.info('$ percy exec -- echo "run your test suite"')
      return
    }

    if (this.percyWillRun()) {
      await this.start(config(flags))
    }

    // Even if Percy will not run, continue to run the subprocess
    const spawnedProcess = spawn(command, argv, { stdio: 'inherit' })
    spawnedProcess.on('exit', (code) => this.stop(code))
    spawnedProcess.on('error', (error) => {
      this.logger.error(error)
      this.stop(1)
    })
  }
}
