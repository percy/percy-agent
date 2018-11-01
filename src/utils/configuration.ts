let yaml = require('js-yaml')
let fs = require('fs')
import logger from './logger'

interface Configuration {
  version: number,
  snapshot: {
    widths?: [number],
    'min-height'?: number,
    'enable-javascript'?: boolean
  }
}

let configuration = (filePath = '.percy.yml'): Configuration => {
  let conf = {} as Configuration

  try {
    conf = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'))
  } catch {
    logger.warn('.percy.yml parse error!')
  }

  return conf
}

export default configuration
