import {Command, flags} from '@oclif/command'
import {DEFAULT_CONFIGURATION} from '../configuration/configuration'
import healthCheck from '../utils/health-checker'

export default class HealthCheck extends Command {
  static description = 'Determines if the Percy Agent process is currently running'
  static hidden = true

  static flags = {
    port: flags.integer({
      char: 'p',
      description: [
        `[default: ${DEFAULT_CONFIGURATION.agent.port}]`,
        'Port',
      ].join(' '),
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
