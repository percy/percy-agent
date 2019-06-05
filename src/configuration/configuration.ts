import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'
import { SnapshotConfiguration } from './snapshot-configuration'
import { StaticSnapshotsConfiguration } from './static-snapshots-configuration'

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
  'static-snapshots': StaticSnapshotsConfiguration
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
