import { Command, flags } from '@oclif/command'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import ConfigurationService from '../services/configuration-service'
import ImageSnapshotService from '../services/image-snapshot-service'

export default class Upload extends Command {
  static description = 'Upload a directory containing static snapshot images.'
  static hidden = false

  static args = [{
    name: 'uploadDirectory',
    description: 'A path to the directory containing static snapshot images',
    required: true,
  }]

  static examples = [
    '$ percy upload _images/',
    '$ percy upload _images/ --files **/*.png',
  ]

  static flags = {
    files: flags.string({
      char: 's',
      description: 'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
      default: DEFAULT_CONFIGURATION['image-snapshots'].files,
    }),
  }

  percyToken: string = process.env.PERCY_TOKEN || ''

  percyTokenPresent(): boolean {
    return this.percyToken.trim() !== ''
  }

  async run() {
    // exit gracefully if percy token was not provided
    if (!this.percyTokenPresent()) {
      this.warn('PERCY_TOKEN was not provided.')
      this.exit(0)
    }

    const { args, flags } = this.parse(Upload)

    const configurationService = new ConfigurationService()
    configurationService.applyFlags(flags)
    configurationService.applyArgs(args)
    const configuration = configurationService.configuration

    // upload snapshot images
    const imageSnapshotService = new ImageSnapshotService(configuration['image-snapshots'])
    await imageSnapshotService.snapshotAll()
  }
}
