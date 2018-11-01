let yaml = require('js-yaml')
let fs = require('fs')
let path = require('path')

export interface SnapshotConfiguration {
  widths?: [number],
  'min-height'?: number,
}

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
}

let configuration = (relativePath = '.percy.yml'): Configuration => {
  const confFilePath = path.join(process.cwd(), relativePath)

  try {
    return yaml.safeLoad(fs.readFileSync(confFilePath, 'utf8'))
  } catch {
    // this is ok because we just use this configuration as one of the fallbacks
    // in a chain. snapshot specific options -> agent configuration -> default values
    return {} as Configuration
  }
}

export default configuration
