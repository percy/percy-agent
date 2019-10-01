// @ts-ignore missing type defs
import * as cosmiconfig from 'cosmiconfig'
import * as merge from 'deepmerge'
import { inspect } from 'util'
import { Configuration, DEFAULT_CONFIGURATION } from '../configuration/configuration'
import logger from './logger'

const { isArray } = Array
const { assign, keys } = Object
const explorer = cosmiconfig('percy', {
  searchPlaces: [
    'package.json',
    '.percyrc',
    '.percy.json',
    '.percy.yaml',
    '.percy.yml',
    '.percy.js',
    'percy.config.js',
  ],
})

function removeUndefined(obj: any): any {
  if (isArray(obj)) { return obj }

  return keys(obj).reduce((o: any, key) => {
    const val = typeof obj[key] === 'object'
      ? removeUndefined(obj[key])
      : obj[key]

    return val !== undefined
      ? assign(o || {}, { [key]: val })
      : o
  }, undefined)
}

function transform(flags: any, args: any) {
  return removeUndefined({
    'agent': {
      'port': flags.port,
      'asset-discovery': {
        'allowed-hostnames': flags['allowed-hostname'],
        'network-idle-timeout': flags['network-idle-timeout'],
      },
    },
    'static-snapshots': {
      'path': args.snapshotDirectory,
      'base-url': flags['base-url'],
      'snapshot-files': flags['snapshot-files'],
      'ignore-files': flags['ignore-files'],
    },
    'image-snapshots': {
      path: args.uploadDirectory,
      files: flags.files,
      ignore: flags.ignore,
    },
  })
}

export default function config({ config, ...flags }: any, args: any = {}) {
  let loaded

  try {
    const result = config
      ? explorer.loadSync(config)
      : explorer.searchSync()

    if (result && result.config) {
      logger.debug(`Current config file path: ${result.filepath}`)
      loaded = result.config
    } else {
      logger.debug('Config file not found')
    }
  } catch (error) {
    logger.debug(`Failed to load or parse config file: ${error}`)
  }

  const provided = transform(flags, args)
  const overrides = loaded && provided ? merge(loaded, provided) : (loaded || provided)

  if (overrides) {
    logger.debug(`Using config: ${inspect(overrides, { depth: null })}`)
  }

  return merge.all([DEFAULT_CONFIGURATION, overrides].filter(Boolean)) as Configuration
}
