import { DEFAULT_PORT } from '../services/agent-service-constants'
import { AgentConfiguration } from './agent-configuration'
import { ImageSnapshotsConfiguration } from './image-snapshots-configuration'
import { SnapshotConfiguration } from './snapshot-configuration'
import { StaticSnapshotsConfiguration } from './static-snapshots-configuration'

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
  'static-snapshots': StaticSnapshotsConfiguration
  'image-snapshots': ImageSnapshotsConfiguration
  agent: AgentConfiguration
}

export const DEFAULT_CONFIGURATION: Configuration = {
  'version': 1.0,
  'snapshot': {
    'percy-css': '',
    'widths': [1280, 375], // px
    'min-height': 1024, // px
  },
  'agent': {
    'port': DEFAULT_PORT,
    'asset-discovery': {
      'request-headers': {},
      'allowed-hostnames': [],
      'network-idle-timeout': 125, // ms
      'page-pool-size-min': 1, // pages
      'page-pool-size-max': 5, // pages
      'cache-responses': true,
    },
  },
  'static-snapshots': {
    'path': '.',
    'base-url': '/',
    'snapshot-files': '**/*.html,**/*.htm',
    'ignore-files': '',
    'port': DEFAULT_PORT + 1,
  },
  'image-snapshots': {
    path: '.',
    files: '**/*.png,**/*.jpg,**/*.jpeg',
    ignore: '',
  },
}
