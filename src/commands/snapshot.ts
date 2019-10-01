import { flags } from '@oclif/command'
import { existsSync } from 'fs'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import StaticSnapshotService from '../services/static-snapshot-service'
import config from '../utils/configuration'
import logger from '../utils/logger'
import PercyCommand from './percy-command'

export default class Snapshot extends PercyCommand {
  static description = 'Snapshot a directory containing a pre-built static website.'
  static hidden = false

  static args = [{
    name: 'snapshotDirectory',
    description: 'A path to the directory you would like to snapshot',
    required: true,
  }]

  static examples = [
    '$ percy snapshot _site/',
    '$ percy snapshot _site/ --base-url "/blog/"',
    '$ percy snapshot _site/ --ignore-files "/blog/drafts/**"',
  ]

  static flags = {
    'snapshot-files': flags.string({
      char: 's',
      description: 'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
      default: DEFAULT_CONFIGURATION['static-snapshots']['snapshot-files'],
    }),
    'ignore-files': flags.string({
      char: 'i',
      description: 'Glob or comma-seperated string of globs for matching the files and directories to ignore.',
      default: DEFAULT_CONFIGURATION['static-snapshots']['ignore-files'],
    }),
    'base-url': flags.string({
      char: 'b',
      description: 'If your static files will be hosted in a subdirectory, instead \n' +
      'of the webserver\'s root path, set that subdirectory with this flag.',
      default: DEFAULT_CONFIGURATION['static-snapshots']['base-url'],
    }),
    'allowed-hostname': flags.string({
      char: 'h',
      description: 'Allowable hostname(s) to capture assets from',
      multiple: true,
    }),
    // from exec command. needed to start the agent service.
    'network-idle-timeout': flags.integer({
      char: 't',
      default: DEFAULT_CONFIGURATION.agent['asset-discovery']['network-idle-timeout'],
      description: 'Asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: DEFAULT_CONFIGURATION.agent.port,
      description: 'Port',
    }),
  }

  async run() {
    await super.run()

    const { args, flags } = this.parse(Snapshot)
    const configuration = config(flags, args)

    // exit gracefully if percy will not run
    if (!this.percyWillRun()) { this.exit(0) }

    const baseUrl = configuration['static-snapshots']['base-url']
    const snapshotPath = configuration['static-snapshots'].path

    // check that base url starts with a slash and exit if it is missing
    if (baseUrl[0] !== '/') {
      logger.warn('The base-url flag must begin with a slash.')
      this.exit(1)
    }

    if (!existsSync(snapshotPath)) {
      logger.warn(`Exiting. The passed directory (${snapshotPath}) is empty.`)
      this.exit(1)
    }

    // start agent service and attach process handlers
    await this.start(configuration)

    const staticSnapshotService = new StaticSnapshotService(configuration['static-snapshots'])

    // start the snapshot service
    await staticSnapshotService.start()

     // take the snapshots
    await staticSnapshotService.snapshotAll()

     // stop the static snapshot and agent services
    await staticSnapshotService.stop()
    await this.stop()
  }
}
