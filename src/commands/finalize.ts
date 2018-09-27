import {flags} from '@oclif/command'
import PercyCommand from './percy-command'
import BuildService from '../services/build-service'

export default class Finalize extends PercyCommand {
  static description = 'finalize a build'
  static hidden = false

  static flags = {
    all: flags.boolean({char: 'a'}),
  }

  static examples = [
    '$ percy-agent finalize --all'
  ]

  buildService: BuildService = new BuildService()

  async run() {
    const {flags} = this.parse(Finalize)

    if (this.percyEnvVarsMissing()) { return }

    if (!process.env.PERCY_PARALLEL_NONCE) {
      this.logMissingEnvVar('PERCY_PARALLEL_NONCE')
      return
    }

    if (flags.all) {
      await this.buildService.finalizeAll()
      this.logger.info('Finalized parallel build.')
    }
  }
}
