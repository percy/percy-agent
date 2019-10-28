import { AssetDiscoveryConfiguration } from '../configuration/asset-discovery-configuration';
import { SnapshotOptions } from '../percy-agent-client/snapshot-options';
import { AssetDiscoveryService } from './asset-discovery-service';
import PercyClientService from './percy-client-service';
import ResourceService from './resource-service';
export default class SnapshotService extends PercyClientService {
    assetDiscoveryService: AssetDiscoveryService;
    resourceService: ResourceService;
    buildId: number;
    constructor(buildId: number, configuration?: AssetDiscoveryConfiguration);
    buildResources(rootResourceUrl: string, domSnapshot: string | undefined, options: SnapshotOptions, logger: any): Promise<any[]>;
    buildRootResource(rootResourceUrl: string, domSnapshot?: string): Promise<any[]>;
    buildLogResource(logFilePath: string): any;
    buildPercyCSSResource(url: string, fileName: string, css: string, logger: any): any;
    create(name: string, resources: any[], options?: SnapshotOptions, clientInfo?: string | null, environmentInfo?: string | null): Promise<any>;
    finalize(snapshotId: number): Promise<boolean>;
}
