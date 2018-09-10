import PercyCommand from './percy-command'
import {flags} from '@oclif/command'
import * as childProcess from 'child_process'

export default class Exec extends PercyCommand {
  static description = 'Start and stop Percy agent around a supplied command'
  static hidden = false

  static examples = [
    '$ percy-agent exec "echo \\"percy-agent is running around this echo command\\""'
  ]

  static args = [
    {
      name: 'command',
      required: true,
      description: 'command to run'
    },
  ]

  static flags = {
    port: flags.integer({
      char: 'p',
      description: 'port',
      default: 5338,
    }),
  }

  async run() {
    const {args} = this.parse(Exec)
    const {flags} = this.parse(Exec)
    let port = flags.port as number

    if (this.percyEnvVarsMissing()) { return }

    await this.agentService.start(port)
    this.logStart(port)

    const spawnedProcess = childProcess.exec(args.command)

    spawnedProcess.stdout.on('data', (data: any) => {
      console.log(data)
    })

    spawnedProcess.stderr.on('data', (data: any) => {
      console.error(data)
    })

    spawnedProcess.on('close', async (code: any) => {
      this.logger.info(`exiting with code: ${code}`)
      await this.agentService.stop()
    })

    spawnedProcess.unref()
  }
}
