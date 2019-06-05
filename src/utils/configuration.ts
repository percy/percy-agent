import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'

export interface SnapshotConfiguration {
  widths?: [number],
  'min-height'?: number,
}

export interface StaticSiteSnapshotConfiguration {
  'base-url'?: string,
  'snapshot-files'?: string,
  'ignore-files'?: string,
}

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
  'static-snapshots': StaticSiteSnapshotConfiguration
}

const configuration = (relativePath = '.percy.yml'): Configuration => {
  const configFilePath = path.join(process.cwd(), relativePath)

  try {
    return yaml.safeLoad(fs.readFileSync(configFilePath, 'utf8'))
  } catch {
    // this is ok because we just use this configuration as one of the fallbacks
    // in a chain. snapshot specific options -> agent configuration -> default values

    const defaultConfiguration: Configuration = {
      'version': 1.0,
      'snapshot': {},
      'static-snapshots': {},
    }

    return defaultConfiguration
  }
}

export default configuration
