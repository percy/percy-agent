import {Command, flags} from '@oclif/command'
import Axios from 'axios'
import ProcessService from '../services/process-service'
import logger from '../utils/logger'

export default class Stop extends Command {
  static description = 'Stops the percy-agent process.'
  static examples = [
    '$ percy-agent stop\n' +
    '[info] gracefully stopping percy-agent...\n' +
    '[info] percy-agent has stopped.',
  ]

  static flags = {
    port: flags.string({
      char: 'p',
      description: 'port',
      default: '5338',
    }),
    force: flags.boolean({char: 'f'}),
  }

  async run() {
    const {flags} = this.parse(Stop)
    const processService = new ProcessService()

    if (await processService.isRunning()) {
      await Axios(`http://localhost:${flags.port}/percy/finalize`, {method: 'POST'})
        .catch(_error => {})

      await Axios(`http://localhost:${flags.port}/percy/stop`, {method: 'POST'})
        .catch(_error => { })

      let stopMethod = 'gracefully'
      if (flags.force) { stopMethod = 'forcefully' }

      const pid = await processService.getPid()
      logger.info(`${stopMethod} stopping percy-agent[${pid}]...`)

      await processService.kill(flags.force)

      try {
        await processService.kill(flags.force)
        logger.info(`percy-agent[${pid}] has stopped.`)
      } catch (error) {
        logger.warn(`percy-agent[${pid}] is already stopped.`)
        logger.debug(error)
      }
    } else {
      logger.warn('percy-agent is already stopped.')
    }
  }
}
