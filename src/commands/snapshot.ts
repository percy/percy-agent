import {flags} from '@oclif/command'
import Constants from '../services/constants'
import {StaticSnapshotOptions} from '../services/static-snapshot-options'
import StaticSnapshotService from '../services/static-snapshot-service'
import logger from '../utils/logger'
import PercyCommand from './percy-command'

export default class Snapshot extends PercyCommand {
  static description = 'Snapshot a directory of webpages'
  static hidden = true

  static args = [{
    name: 'snapshotDirectory',
    description: 'A path to the directory you would like to snapshot',
    required: true,
  }]

  static examples = [
    '$ percy snapshot _site/',
    '$ percy snapshot _site/ --base-url "/blog"',
    '$ percy snapshot _site/ --ignore-files "\.(blog|docs)$"',
  ]

  static flags = {
    'snapshot-files': flags.string({
      char: 'c',
      description: 'Regular expression for matching the files to snapshot.',
      default: '\.(html|htm)$',
    }),
    'ignore-files': flags.string({
      char: 'i',
      description: 'Regular expression for matching the files to ignore.',
      default: '',
    }),
    'base-url': flags.string({
      char: 'b',
      description: 'If your static files will be hosted in a subdirectory, instead \n' +
      'of the webserver\'s root path, set that subdirectory with this flag.',
      default: '/',
    }),
    // from exec command. needed to start the agent service.
    'network-idle-timeout': flags.integer({
      char: 't',
      default: Constants.NETWORK_IDLE_TIMEOUT,
      description: 'asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: Constants.PORT,
      description: 'port',
    }),
  }

  async run() {
    await super.run()

    const {args, flags} = this.parse(Snapshot)

    const isWindows = process.platform === 'win32'

    const snapshotDirectory = args.snapshotDirectory as string
    const port = flags.port as number
    const staticServerPort = port + 1
    const networkIdleTimeout = flags['network-idle-timeout'] as number
    const baseUrl = flags['base-url'] as string
    const ignoreFilesRegex = flags['ignore-files'] as string
    const snapshotFilesRegex = flags['snapshot-files'] as string

    // exit gracefully if percy will not run
    if (!this.percyWillRun()) { this.exit(0) }

    // check that base url starts with a slash and exit if it is missing
    if (baseUrl[0] !== '/') {
      logger.warn('The base-url flag must begin with a slash.')
      this.exit(1)
    }

    // start the agent service
    await this.agentService.start({port, networkIdleTimeout})
    this.logStart()

    const options: StaticSnapshotOptions = {
      port: staticServerPort,
      snapshotDirectory,
      baseUrl,
      snapshotFilesRegex,
      ignoreFilesRegex,
    }

    const staticSnapshotService = new StaticSnapshotService(options)

    // start the snapshot service
    await staticSnapshotService.start()

     // take the snapshots
    await staticSnapshotService.snapshotAll()

     // stop the static snapshot and agent services
    await staticSnapshotService.stop()
    await this.agentService.stop()
  }
}
