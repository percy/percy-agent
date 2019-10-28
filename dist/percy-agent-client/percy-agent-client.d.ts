export declare class PercyAgentClient {
    xhr: XMLHttpRequest;
    agentHost: string;
    agentConnected: boolean;
    constructor(agentHost: string, xhr?: any);
    post(path: string, data: any): void;
    healthCheck(): void;
}
