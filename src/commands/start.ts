import {Command, flags} from '@oclif/command'

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
      options: ['5338', '55000'],
      default: '5338',
    }),
    force: flags.boolean({char: 'f'}),
  }

  async run() {
    const {flags} = this.parse(Start)

    this.log(`percy-agent has started on port ${flags.port}`)
  }
}
