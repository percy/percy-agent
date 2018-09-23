import PercyCommand from './percy-command'
import {flags} from '@oclif/command'
import {spawn} from 'child_process'

export default class Exec extends PercyCommand {
  static description = 'Start and stop Percy agent around a supplied command'
  static hidden = false
  static strict = false

  static examples = [
    '$ percy-agent exec -- echo \"percy-agent is running around this echo command\"',
    '$ percy-agent exec -- bash -c "echo foo && echo bar"'
  ]

  static flags = {
    port: flags.integer({
      char: 'p',
      description: 'port',
      default: 5338,
    }),
  }

  async run() {
    const {argv} = this.parse(Exec)
    const {flags} = this.parse(Exec)

    let port = flags.port as number
    let command = argv.shift()

    if (!command) {
      this.logger.info('You must supply a command to run after --')
      this.logger.info('Example:')
      this.logger.info('$ percy-agent exec -- echo "run your test suite"')
      return
    }

    if (!this.percyEnvVarsMissing()) {
      await this.agentService.start(port)
      this.logStart(port)
    }

    const spawnedProcess = spawn(command, argv, {stdio: 'inherit'})

    spawnedProcess.on('exit', async (code: any) => {
      this.logger.info(`exited process with code: ${code}`)

      if (!this.percyEnvVarsMissing()) {
        await this.agentService.stop()
      }
    })

    spawnedProcess.unref()
  }
}
