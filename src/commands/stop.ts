import {Command, flags} from '@oclif/command'

export default class Stop extends Command {
  static description = 'Stops the percy-agent process.'

  static examples = [
    `$ percy-agent stop
gracefully stopping percy-agent...
percy-agent has stopped.
`,
  ]

  static flags = {
    force: flags.boolean({char: 'f'}),
  }

  async run() {
    const {flags} = this.parse(Stop)

    if (flags.force) {
      this.log(`forcefully stopping percy-agent...`)
    } else {
      this.log(`gracefully stopping percy-agent...`)
    }

    this.log(`percy-agent has stopped.`)
  }
}
