let yaml = require('js-yaml')
let fs = require('fs')

interface Configuration {
  version: number,
  snapshot: {
    widths?: [number],
    'min-height'?: number,
    'enable-javascript'?: boolean
  }
}

let configuration = (filePath = '.percy.yml'): Configuration => {
  return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'))
}

export default configuration
