import { AgentConfiguration } from './agent-configuration';
import { ImageSnapshotsConfiguration } from './image-snapshots-configuration';
import { SnapshotConfiguration } from './snapshot-configuration';
import { StaticSnapshotsConfiguration } from './static-snapshots-configuration';
export interface Configuration {
    version: number;
    snapshot: SnapshotConfiguration;
    'static-snapshots': StaticSnapshotsConfiguration;
    'image-snapshots': ImageSnapshotsConfiguration;
    agent: AgentConfiguration;
}
export declare const DEFAULT_CONFIGURATION: Configuration;
