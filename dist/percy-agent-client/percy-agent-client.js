"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agent_service_constants_1 = require("../services/agent-service-constants");
class PercyAgentClient {
    constructor(agentHost, xhr) {
        this.agentConnected = false;
        this.agentHost = agentHost;
        this.xhr = new xhr() || new XMLHttpRequest();
        this.healthCheck();
    }
    post(path, data) {
        if (!this.agentConnected) {
            console.warn('percy agent not started.');
            return;
        }
        this.xhr.open('post', `${this.agentHost}${path}`, false); // synchronous request
        this.xhr.setRequestHeader('Content-Type', 'application/json');
        this.xhr.send(JSON.stringify(data));
    }
    healthCheck() {
        try {
            this.xhr.open('get', `${this.agentHost}${agent_service_constants_1.HEALTHCHECK_PATH}`, false);
            this.xhr.onload = () => {
                if (this.xhr.status === 200) {
                    this.agentConnected = true;
                }
            };
            this.xhr.send();
        }
        catch (_a) {
            this.agentConnected = false;
        }
    }
}
exports.PercyAgentClient = PercyAgentClient;
