import {Command, flags} from '@oclif/command'
import {HttpService} from '../services/http-service'
const fs = require('fs')

export default class Start extends Command {
  static description = 'Starts the percy-agent process.'

  static examples = [
    '$ percy-agent start' +
    'percy-agent has started on port 5338',
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
  static pidFilePath = './tmp/percy-agent.pid'

  async run() {
    const {flags} = this.parse(Start)

    let port = parseInt(flags.port || '5338')

    if (!flags.attached) {
      // detached mode
      if (fs.existsSync(Start.pidFilePath)) {
        let pidFileContents: Buffer = await fs.readFileSync(Start.pidFilePath)
        let pid: number = parseInt(pidFileContents.toString('utf8').trim())

        if (pid) {
          this.log(`percy-agent[${pid}] is already running`)
          process.exit(0)
        }
      }

      const spawn = require('child_process').spawn

      const out = fs.openSync('./log/percy-agent.log', 'a')
      const err = fs.openSync('./log/percy-agent.err.log', 'a')

      const startProcess = spawn(process.argv[0], ['bin/run', 'start', '--attached', '--port', port], {
        detached: false,
        stdio: ['ignore', out, err]
      })

      await fs.writeFileSync('./tmp/percy-agent.pid', startProcess.pid)

      this.log(`percy-agent[${startProcess.pid}] has started on port ${port}`)

      startProcess.unref()
    } else {
      // attached mode
      new HttpService(port)
    }
  }
}
