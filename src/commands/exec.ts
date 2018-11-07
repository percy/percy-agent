import PercyCommand from './percy-command'
import {flags} from '@oclif/command'
import {spawn} from 'child_process'

export default class Exec extends PercyCommand {
  static description = 'Start and stop Percy around a supplied command'
  static hidden = false
  static strict = false

  static examples = [
    '$ percy exec -- echo \"percy is running around this echo command\"',
    '$ percy exec -- bash -c "echo foo && echo bar"'
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
  }

  async run() {
    await super.run()

    const {argv} = this.parse(Exec)
    const {flags} = this.parse(Exec)

    let port = flags.port as number
    let networkIdleTimeout = flags['network-idle-timeout'] as number
    let command = argv.shift()

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
