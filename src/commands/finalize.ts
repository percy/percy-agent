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
    '$ percy finalize --all\n' +
    '[percy] Finalized parallel build.',
  ]

  buildService: BuildService = new BuildService()

  async run() {
    await super.run()

    this.parse(Finalize)

    const result = await this.buildService.finalizeAll()
    if (result) {
      this.logger.info('Finalized parallel build.')

      const webUrl = result.body.data.attributes['web-url']
      this.logger.info('Visual diffs are now processing: ' + colors.blue(`${webUrl}`))
    }
  }
}
