import {flags} from '@oclif/command'
import Constants from '../services/constants'
import {StaticSnapshotOptions} from '../services/static-snapshot-options'
import StaticSnapshotService from '../services/static-snapshot-service'
import configuration, {StaticSiteSnapshotConfiguration} from '../utils/configuration'
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
    '$ percy snapshot _site/ --base-url "/blog"',
    '$ percy snapshot _site/ --ignore-files "/blog/drafts/**"',
  ]

  static flags = {
    'snapshot-files': flags.string({
      char: 's',
      description: 'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
      default: '**/*.html,**/*.htm',
    }),
    'ignore-files': flags.string({
      char: 'i',
      description: 'Glob or comma-seperated string of globs for matching the files and directories to ignore.',
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
      description: 'Asset discovery network idle timeout (in milliseconds)',
    }),
    'port': flags.integer({
      char: 'p',
      default: Constants.PORT,
      description: 'Port',
    }),
  }

  async run() {
    await super.run()

    const {args, flags} = this.parse(Snapshot)

    const snapshotDirectory = args.snapshotDirectory as string
    const port = flags.port as number
    const staticServerPort = port + 1
    const networkIdleTimeout = flags['network-idle-timeout'] as number

    const baseUrlFlag = flags['base-url'] as string
    const rawIgnoreGlobFlag = flags['ignore-files'] as string
    const rawSnapshotGlobFlag = flags['snapshot-files'] as string

    // exit gracefully if percy will not run
    if (!this.percyWillRun()) { this.exit(0) }

    // read configurations from the percy.yml file
    const staticSiteConfiguration = (configuration().static_site || {}) as StaticSiteSnapshotConfiguration
    const baseUrl = staticSiteConfiguration['base-url'] || baseUrlFlag
    const rawSnapshotGlobs = staticSiteConfiguration['snapshot-files'] || rawSnapshotGlobFlag
    const rawIgnoreGlobs = staticSiteConfiguration['ignore-files'] || rawIgnoreGlobFlag

    const snapshotGlobs = rawSnapshotGlobs.split(',')

    // if it is an empty string then convert it to an empty array instead of an array of an empty string
    const ignoreGlobs = rawIgnoreGlobs ? rawIgnoreGlobs.split(',') : []

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
      snapshotGlobs,
      ignoreGlobs,
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
