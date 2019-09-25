import * as deepmerge from 'deepmerge'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'
import logger from '../utils/logger'
import { Configuration, DEFAULT_CONFIGURATION } from './../configuration/configuration'

export default class ConfigurationService {
  static DEFAULT_FILE = '.percy.yml'

  configuration: Configuration

  constructor(configurationFile: string = ConfigurationService.DEFAULT_FILE) {
    // We start with the default configuration
    this.configuration = DEFAULT_CONFIGURATION

    // Next we merge in configuration from .percy.yml if we have it
    this.applyFile(configurationFile)
  }

  applyFile(configurationFile: string): Configuration {
    try {
      const userConfigFilePath = path.join(process.cwd(), configurationFile)
      const userConf = yaml.safeLoad(fs.readFileSync(userConfigFilePath, 'utf8'))
      logger.debug(`Current config file path: ${userConfigFilePath}`)

      // apply a deep overwrite merge to userConf and this.configuration
      const overwriteMerge = (destinationArray: any, sourceArray: any, options: any) => sourceArray
      this.configuration = deepmerge(this.configuration, userConf, { arrayMerge: overwriteMerge })
    } catch (error) {
      logger.debug(`.percy.yml configuration file not supplied or failed to be loaded and parsed: ${error}`)
    }

    return this.configuration
  }

  applyFlags(flags: any): Configuration {
    if (flags.port) {
      this.configuration.agent.port = flags.port
    }

    if (flags['allowed-hostname']) {
      this.configuration.agent['asset-discovery']['allowed-hostnames'] =
        flags['allowed-hostname'].concat(this.configuration.agent['asset-discovery']['allowed-hostnames'])
    }

    if (flags['network-idle-timeout']) {
      this.configuration.agent['asset-discovery']['network-idle-timeout'] = flags['network-idle-timeout']
    }

    if (flags['base-url']) {
      this.configuration['static-snapshots']['base-url'] = flags['base-url']
    }

    if (flags['snapshot-files']) {
      this.configuration['static-snapshots']['snapshot-files'] = flags['snapshot-files']
    }

    if (flags['ignore-files']) {
      this.configuration['static-snapshots']['ignore-files'] = flags['ignore-files']
    }

    if (flags.files) {
      this.configuration['image-snapshots'].files = flags.files
    }

    if (flags.ignore) {
      this.configuration['image-snapshots'].ignore = flags.ignore
    }

    return this.configuration
  }

  applyArgs(args: any): Configuration {
    if (args.snapshotDirectory) {
      this.configuration['static-snapshots'].path = args.snapshotDirectory
    }

    if (args.uploadDirectory) {
      this.configuration['image-snapshots'].path = args.uploadDirectory
    }

    return this.configuration
  }
}
