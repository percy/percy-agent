import {Command, flags} from '@oclif/command'

export default class Stop extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ percy-agent stop
hello world from ./src/stop.ts!
`,
  ]

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Stop)

    const name = flags.name || 'world'
    this.log(`hello ${name} from ${__filename}!`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
