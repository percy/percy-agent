import {flags} from '@oclif/command'
import Axios from 'axios'
import PercyCommand from './percy-command'

export default class Stop extends PercyCommand {
  static description = 'Stops the percy-agent process.'
  static hidden = false

  static examples = [
    '$ percy-agent stop\n' +
    'info: percy-agent has stopped.',
  ]

  static flags = {
    port: flags.string({
      char: 'p',
      description: 'port',
      default: '5338',
    })
  }

  async run() {
    const {flags} = this.parse(Stop)
    const port = flags.port ? parseInt(flags.port) : 5338

    if (await this.processService().isRunning()) {
      await this.postToRunningAgent('/percy/stop', port)
    } else {
      this.logger().warn('percy-agent is already stopped.')
    }
  }

  private async postToRunningAgent(path: string, port: number) {
    await Axios(`http://localhost:${port}${path}`, {method: 'POST'})
      .catch((error: any) => {
        if (error.message === 'socket hang up') { // We expect a hangup
          this.logger().info('percy-agent stopped.')
        } else {
          this.logger().error(`${error.name} ${error.message}`)
          this.logger().debug(error)
        }
      })
  }
}
