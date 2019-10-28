import { Configuration } from '../configuration/configuration';
import BuildService from './build-service';
import SnapshotService from './snapshot-service';
export declare class AgentService {
    buildService: BuildService;
    snapshotService: SnapshotService | null;
    private readonly app;
    private readonly publicDirectory;
    private snapshotCreationPromises;
    private snapshotConfig;
    private server;
    private buildId;
    constructor();
    start(configuration: Configuration): Promise<void>;
    stop(): Promise<void>;
    private handleSnapshot;
    private handleStop;
    private handleHealthCheck;
}
