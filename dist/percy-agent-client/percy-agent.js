"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agent_service_constants_1 = require("../services/agent-service-constants");
const dom_1 = require("./dom");
const percy_agent_client_1 = require("./percy-agent-client");
class PercyAgent {
    constructor(options = {}) {
        this.client = null;
        this.clientInfo = options.clientInfo || null;
        this.environmentInfo = options.environmentInfo || null;
        // Default to 'true' unless explicitly disabled.
        this.handleAgentCommunication = options.handleAgentCommunication !== false;
        this.domTransformation = options.domTransformation || null;
        this.port = options.port || agent_service_constants_1.DEFAULT_PORT;
        if (this.handleAgentCommunication) {
            this.xhr = options.xhr || XMLHttpRequest;
            this.client = new percy_agent_client_1.PercyAgentClient(`http://localhost:${this.port}`, this.xhr);
        }
    }
    snapshot(name, options = {}) {
        const documentObject = options.document || document;
        const domSnapshot = this.domSnapshot(documentObject, options);
        if (this.handleAgentCommunication && this.client) {
            this.client.post(agent_service_constants_1.SNAPSHOT_PATH, {
                name,
                url: documentObject.URL,
                percyCSS: options.percyCSS,
                // enableJavascript is deprecated. Use enableJavaScript
                enableJavaScript: options.enableJavaScript || options.enableJavascript,
                widths: options.widths,
                // minimumHeight is deprecated. Use minHeight
                minHeight: options.minHeight || options.minimumHeight,
                clientInfo: this.clientInfo,
                environmentInfo: this.environmentInfo,
                domSnapshot,
            });
        }
        return domSnapshot;
    }
    domSnapshot(documentObject, options = {}) {
        const dom = new dom_1.default(documentObject, Object.assign({}, options, { domTransformation: this.domTransformation }));
        return dom.snapshotString();
    }
}
exports.default = PercyAgent;
