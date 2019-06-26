import { AgentConfiguration } from './agent-configuration'
import { SnapshotConfiguration } from './snapshot-configuration'
import { StaticSnapshotsConfiguration } from './static-snapshots-configuration'

export interface Configuration {
  version: number,
  snapshot: SnapshotConfiguration
  'static-snapshots': StaticSnapshotsConfiguration
  agent: AgentConfiguration
}
