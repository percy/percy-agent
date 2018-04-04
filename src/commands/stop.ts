import {Command, flags} from '@oclif/command'
import ProcessCommand from '../process_command'
const fs = require('fs')

export default class Stop extends Command {
  static description = 'Stops the percy-agent process.'
  static examples = [
    '$ percy-agent stop\n' +
    'gracefully stopping percy-agent...\n' +
    'percy-agent has stopped.',
  ]

  static flags = {
    force: flags.boolean({char: 'f'}),
  }

  async run() {
    const {flags} = this.parse(Stop)

    try {
      let pidFileContents: Buffer = await fs.readFileSync(ProcessCommand.pidFilePath)
      let pid: number = parseInt(pidFileContents.toString('utf8').trim())
      await fs.unlinkSync(ProcessCommand.pidFilePath)

      if (flags.force) {
        this.warn(`forcefully stopping percy-agent[${pid}]...`)
        process.kill(pid, 'SIGKILL')
      } else {
        this.log(`gracefully stopping percy-agent[${pid}]...`)
        process.kill(pid, 'SIGHUP')
      }

      this.log('percy-agent has stopped.')
    } catch (error) {
      this.handleError(error)
    }
  }

  handleError(error: any) {
    if (error.code === 'ENOENT' || error.code === 'ESRCH') {
      this.log('percy-agent is already stopped.')
    } else {
      this.log(error)
    }

    this.exit(0)
  }
}
