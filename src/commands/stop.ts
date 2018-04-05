import {Command, flags} from '@oclif/command'
import ProcessService from '../services/process-service'

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
    const processService = new ProcessService()

    if (await processService.isRunning()) {
      const pid = await processService.pid()

      let stopMethod = 'gracefully'
      if (flags.force) { stopMethod = 'forcefully' }

      this.log(`${stopMethod} stopping percy-agent[${pid}]...`)

      await processService.kill(flags.force)
      this.log('percy-agent has stopped.')
    } else {
      this.log('percy-agent is already stopped.')
    }
  }
}
