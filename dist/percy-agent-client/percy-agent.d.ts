import { ClientOptions } from './client-options';
import { PercyAgentClient } from './percy-agent-client';
import { SnapshotOptions } from './snapshot-options';
export default class PercyAgent {
    clientInfo: string | null;
    environmentInfo: string | null;
    xhr: any;
    handleAgentCommunication: boolean;
    port: number;
    domTransformation: any | null;
    client: PercyAgentClient | null;
    constructor(options?: ClientOptions);
    snapshot(name: string, options?: SnapshotOptions): string;
    private domSnapshot;
}
