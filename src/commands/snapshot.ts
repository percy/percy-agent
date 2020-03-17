import { flags } from '@oclif/command'
import { existsSync } from 'fs'
import * as globby from 'globby'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import { StaticSnapshotsConfiguration } from '../configuration/static-snapshots-configuration'
import StaticSnapshotService from '../services/static-snapshot-service'
import config, { parseGlobs } from '../utils/configuration'
import logger from '../utils/logger'
import PercyCommand from './percy-command'

export default class Snapshot extends PercyCommand {
  static description = 'Snapshot a directory containing a pre-built static website.'
  static hidden = false

  static args = [{
    name: 'snapshotDirectory',
    description: [
      `[default: ${DEFAULT_CONFIGURATION['static-snapshots'].path}]`,
      'A path to the directory you would like to snapshot',
    ].join(' '),
  }]

  static examples = [
    '$ percy snapshot _site/',
    '$ percy snapshot _site/ --base-url "/blog/"',
    '$ percy snapshot _site/ --ignore-files "/blog/drafts/**"',
  ]

  static flags = {
    'snapshot-files': flags.string({
      char: 's',
      description: [
        `[default: ${DEFAULT_CONFIGURATION['static-snapshots']['snapshot-files']}]`,
        'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
      ].join(' '),
    }),
    'ignore-files': flags.string({
      char: 'i',
      description: [
        `[default: ${DEFAULT_CONFIGURATION['static-snapshots']['ignore-files']}]`,
        'Glob or comma-seperated string of globs for matching the files and directories to ignore.',
      ].join(' '),
    }),
    'base-url': flags.string({
      char: 'b',
      description: [
        `[default: ${DEFAULT_CONFIGURATION['static-snapshots']['base-url']}]`,
        'If your static files will be hosted in a subdirectory, instead',
        'of the webserver\'s root path, set that subdirectory with this flag.',
      ].join(' '),
    }),
    'dry-run': flags.boolean({
      char: 'd',
      description: 'Print the list of paths to snapshot without creating a new build',
    }),
    // from exec command. needed to start the agent service.
    'allowed-hostname': flags.string({
      char: 'h',
      description: 'Allowable hostname(s) to capture assets from',
      multiple: true,
    }),
    'network-idle-timeout': flags.integer({
      char: 't',
      description: [
        `[default: ${DEFAULT_CONFIGURATION.agent['asset-discovery']['network-idle-timeout']}]`,
        'Asset discovery network idle timeout (in milliseconds)',
      ].join(' '),
    }),
    'port': flags.integer({
      char: 'p',
      description: [
        `[default: ${DEFAULT_CONFIGURATION.agent.port}]`,
        'Port',
      ].join(' '),
    }),
    'config': flags.string({
      char: 'c',
      description: 'Path to percy config file',
    }),
  }

  async run() {
    await super.run()

    const { args, flags } = this.parse(Snapshot)
    const configuration = config(flags, args)

    if (flags['dry-run']) {
      await this.dryrun(configuration['static-snapshots'])
      this.exit(0)
    }

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

  // will print the paths that would have been snapshotted
  async dryrun(configuration: StaticSnapshotsConfiguration) {
    // this cannot be done in the static snapshot service because not only does
    // it map paths to localhost URLs, but it also starts the localhost server
    // and creates a new Percy build before parsing any globs
    const globs = parseGlobs(configuration['snapshot-files'])
    const ignore = parseGlobs(configuration['ignore-files'])
    const paths = await globby(globs, { cwd: configuration.path, ignore })

    console.log(paths.map((p) => configuration['base-url'] + p).join('\n'))
  }
}
