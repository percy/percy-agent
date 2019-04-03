import {flags} from '@oclif/command'
import * as colors from 'colors'
import Constants from '../services/constants'
import healthCheck from '../utils/health-checker'
import PercyCommand from './percy-command'

export default class HealthCheck extends PercyCommand {
  static description = 'Determins if the Percy Agent process is currently running'
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
    await super.run()

    // If Percy is disabled or is missing a token, gracefully exit here
    if (!this.percyWillRun()) { this.exit(0) }

    const {flags} = this.parse(HealthCheck)
    const port = flags.port as number

    await healthCheck(port, {
      shouldRetry: () => false,
    })
  }
}
