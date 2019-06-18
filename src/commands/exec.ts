import {flags} from '@oclif/command'
import * as spawn from 'cross-spawn'
import {DEFAULT_PORT} from '../services/agent-service-constants'
import {DEFAULT_NETWORK_IDLE_TIMEOUT} from '../services/asset-discovery-service'
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

    const {argv} = this.parse(Exec)
    const {flags} = this.parse(Exec)

    const port = flags.port as number
    const networkIdleTimeout = flags['network-idle-timeout'] as number
    const command = argv.shift()

    if (!command) {
      this.logger.info('You must supply a command to run after --')
      this.logger.info('Example:')
      this.logger.info('$ percy exec -- echo "run your test suite"')
      return
    }

    if (this.percyWillRun()) {
      await this.agentService.start({port, networkIdleTimeout})
      this.logStart()
    }

    // Even if Percy will not run, continue to run the subprocess
    const spawnedProcess = spawn(command, argv, {stdio: 'inherit'})

    spawnedProcess.on('exit', async (code: any) => {
      if (this.percyWillRun()) {
        await this.agentService.stop()
      }

      process.exit(code)
    })
  }
}
