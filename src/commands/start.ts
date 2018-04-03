import {Command, flags} from '@oclif/command'
import {HttpService} from '../services/http-service'

export default class Start extends Command {
  static description = 'Starts the percy-agent process.'

  static examples = [
    `$ percy-agent start
percy-agent has started on port 5338
`,
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
    }),
  }

  async run() {
    const {flags} = this.parse(Start)
    let port = parseInt(flags.port || '5338')

    if (flags.attached) {
      new HttpService(port)
    }
  }
}
