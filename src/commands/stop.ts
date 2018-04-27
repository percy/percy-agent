import {Command, flags} from '@oclif/command'
import Axios from 'axios'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'

export default class Stop extends Command {
  static description = 'Stops the percy-agent process.'
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
    const processService = new ProcessService()

    if (await processService.isRunning()) {
      await this.postToRunningAgent('/percy/stop', port)
    } else {
      logger.warn('percy-agent is already stopped.')
    }
  }

  private async postToRunningAgent(path: string, port: number) {
    await Axios(`http://localhost:${port}${path}`, {method: 'POST'})
      .catch((error: any) => {
        if (error.message === 'socket hang up') { // We expect a hangup
          logger.info('percy-agent stopped.')
        } else {
          logger.error(`${error.name} ${error.message}`)
          logger.debug(error)
        }
      })
  }
}
