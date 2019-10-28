import { StaticSnapshotsConfiguration } from '../configuration/static-snapshots-configuration';
export default class StaticSnapshotService {
    readonly configuration: StaticSnapshotsConfiguration;
    private readonly app;
    private server;
    constructor(configuration?: StaticSnapshotsConfiguration);
    start(): Promise<void>;
    snapshotAll(): Promise<void>;
    stop(): Promise<void>;
    _buildLocalUrl(): string;
    _buildPageUrls(): Promise<any>;
}
