let yaml = require('js-yaml')
let fs = require('fs')
import logger from './logger'

let configuration = (): any => {
  let conf = {}

  try {
    conf = yaml.safeLoad(fs.readFileSync('.percy,yml', 'utf8'))
  } catch {
    logger.warn('.percy.yml parse error')
  }

  return conf
}

export default configuration
