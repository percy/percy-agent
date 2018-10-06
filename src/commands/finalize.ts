import {flags} from '@oclif/command'
import PercyCommand from './percy-command'
import BuildService from '../services/build-service'
import * as colors from 'colors'

export default class Finalize extends PercyCommand {
  static description = 'finalize a build'
  static hidden = false

  static flags = {
    all: flags.boolean({char: 'a', required: true}),
  }

  static examples = [
    '$ percy-agent finalize --all\n' +
    '[percy] Finalized parallel build.',
  ]

  buildService: BuildService = new BuildService()

  async run() {
    this.parse(Finalize)

    if (this.percyEnvVarsMissing()) { this.exit(1) }

    if (!process.env.PERCY_PARALLEL_NONCE) {
      this.logMissingEnvVar('PERCY_PARALLEL_NONCE')
      this.exit(1)
    }

    const result = await this.buildService.finalizeAll()
    if (result) {
      this.logger.info('Finalized parallel build.')

      const webUrl = result.body.data.attributes['web-url']
      this.logger.info('Visual diffs are now processing: ' + colors.blue(`${webUrl}`))
    }
  }
}
