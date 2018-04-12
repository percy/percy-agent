import {Command, flags} from '@oclif/command'
import HttpService from '../services/http-service'
import ProcessService from '../services/process-service'

export default class Start extends Command {
  static description = 'Starts the percy-agent process.'

  static examples = [
    '$ percy-agent start\n' +
    '[info] percy-agent has started on port 5338',
  ]

  static flags = {
    port: flags.string({
      char: 'p',
      description: 'port',
      default: '5338',
    }),
    attached: flags.boolean({
      char: 'a',
      description: 'start as an attached process',
    })
  }

  async run() {
    const {flags} = this.parse(Start)
    let port = flags.port || '5338'

    if (flags.attached) {
      let httpService = new HttpService()
      await httpService.start(parseInt(port))

      this.log(`[info] percy-agent has started on port ${port}`)
    } else {
      let processService = new ProcessService()

      const pid = await processService.runDetached(
        ['bin/run', 'start', '--attached', '--port', port]
      )

      if (pid) {
        this.log(`[info] percy-agent[${pid}] has started on port ${port}`)
      } else {
        this.log('[info] percy-agent is already running')
      }
    }
  }
}
