import {flags} from '@oclif/command'
import Constants from '../services/constants'
import {StaticSnapshotOptions} from '../services/static-snapshot-options'
import StaticSnapshotService from '../services/static-snapshot-service'
import PercyCommand from './percy-command'

export default class Snapshot extends PercyCommand {
  static description = 'Snapshot a directory of static site assets'
  static hidden = true

  static args = [{
    name: 'staticAssets',
    description: 'The path to the compiled static asset directory.',
    required: true,
  }]

  static examples = [
    '$ percy snapshot _mySite/',
    '$ percy snapshot _mySite/ --baseUrl "blog/"',
    '$ percy snapshot _mySite/ --widths "320,780,1280"',
    '$ percy snapshot _mySite/ --ignore-folders "Tmp,_secrets,node_modules"',
  ]

  static flags = {
    'snapshot-capture-regex': flags.string({
      char: 'c',
      description: 'Regular expression for matching the files to snapshot. Defaults to: "\.(html|htm)$"',
      default: '\.(html|htm)$',
    }),
    'ignore-folders': flags.string({
      char: 'i',
      description: 'Comma-seperated string of folders to ignore. Ex: Tmp,_secrets,node_modules',
    }),
    'widths': flags.string({
      char: 'w',
      description: 'Comma-separated string of rendering widths for snapshots. Ex: 320,1280',
      default: '1280',
    }),
    'baseUrl': flags.string({
      char: 'b',
      description: 'The path that the site will be deployed to on a production server. \
      Use this if your site will be hosted at a non-root url.',
      default: '/',
    }),
    // from exec command. needed to start the agent service.
    'network-idle-timeout': flags.integer({
      char: 't',
      default: 50,
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

    const {args} = this.parse(Snapshot)
    const {flags} = this.parse(Snapshot)

    const staticAssetDirectory = args.staticAssets as string
    const port = flags.port as number
    const portPlusOne = port + 1
    const networkIdleTimeout = flags['network-idle-timeout'] as number
    const rawWidths = flags.widths as string
    const baseUrl = flags.baseUrl as string
    const rawIgnoreFolders = flags['ignore-folders'] as string
    const snapshotCaptureRegex = flags['snapshot-capture-regex'] as string

    // exit gracefully if percy will not run
    if (!this.percyWillRun()) { this.exit(0) }

    const widths = rawWidths.split(',').map(Number)
    const ignoreFolders = rawIgnoreFolders.split(',')

    // start the agent service
    await this.agentService.start({port, networkIdleTimeout})
    this.logStart()

    const options: StaticSnapshotOptions = {
      port: portPlusOne,
      staticAssetDirectory,
      widths,
      baseUrl,
      snapshotCaptureRegex,
      ignoreFolders,
    }

    const staticSnapshotService = new StaticSnapshotService(options)

    // start the snapshot service
    staticSnapshotService.start()

     // take the snapshots
    await staticSnapshotService.snapshotAll()

     // stop the static snapshot and agent services
    await staticSnapshotService.stop()
    await this.agentService.stop()
  }
}
