import { AssetDiscoveryConfiguration } from './asset-discovery-configuration';
export interface AgentConfiguration {
    'port': number;
    'asset-discovery': AssetDiscoveryConfiguration;
}
