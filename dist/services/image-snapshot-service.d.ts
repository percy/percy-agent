import { ImageSnapshotsConfiguration } from '../configuration/image-snapshots-configuration';
import PercyClientService from './percy-client-service';
export default class ImageSnapshotService extends PercyClientService {
    private readonly buildService;
    private readonly configuration;
    constructor(configuration?: ImageSnapshotsConfiguration);
    readonly buildId: number | null;
    makeLocalCopy(imagePath: string): string;
    buildResources(imagePath: string): any[];
    createSnapshot(name: string, resources: any[], width: number, height: number): Promise<any>;
    snapshotAll(): Promise<undefined>;
}
