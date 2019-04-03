import {Command, flags} from '@oclif/command'
import * as colors from 'colors'
import Constants from '../services/constants'
import healthCheck from '../utils/health-checker'

export default class HealthCheck extends Command {
  static description = 'Determines if the Percy Agent process is currently running'
  static hidden = true

  static flags = {
    port: flags.integer({
      char: 'p',
      default: Constants.PORT,
      description: 'port',
    }),
  }

  static examples = [
    '$ percy healthcheck',
    '$ percy healthcheck --port 6884',
  ]

  async run() {
    const {flags} = this.parse(HealthCheck)
    const port = flags.port as number

    await healthCheck(port, {
      shouldRetry: () => false,
    })
  }
}
