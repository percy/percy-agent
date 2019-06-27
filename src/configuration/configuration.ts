import { DEFAULT_PORT } from '../services/agent-service-constants'
import { AgentConfiguration } from './agent-configuration'
import { SnapshotConfiguration } from './snapshot-configuration'
import { StaticSnapshotsConfiguration } from './static-snapshots-configuration'

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
  'static-snapshots': StaticSnapshotsConfiguration
  agent: AgentConfiguration
}

export const DEFAULT_CONFIGURATION: Configuration = {
  'version': 1.0,
  'snapshot': {
    'widths': [1280, 375], // px
    'min-height': 1024, // px
  },
  'agent': {
    'port': DEFAULT_PORT,
    'asset-discovery': {
      'network-idle-timeout': 50, // ms
      'page-pool-size-min': 2, // pages
      'page-pool-size-max': 10, // pages
    },
  },
  'static-snapshots': {
    'path': '.',
    'base-url': '/',
    'snapshot-files': '**/*.html,**/*.htm',
    'ignore-files': '',
    'port': DEFAULT_PORT + 1,
  },
}
