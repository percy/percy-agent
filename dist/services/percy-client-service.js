"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class PercyClientService {
    constructor() {
        const PercyClient = require('percy-client');
        this.percyClient = new PercyClient({
            apiUrl: process.env.PERCY_API,
            token: process.env.PERCY_TOKEN,
            clientInfo: this.clientInfo(),
        });
    }
    parseRequestPath(url) {
        const parsedURL = new url_1.URL(url);
        // Excellent docs about what this is made up of here
        // https://nodejs.org/docs/latest-v8.x/api/url.html#url_url_strings_and_url_objects
        const strippedAnchor = parsedURL.protocol
            + '//'
            + parsedURL.host
            + parsedURL.pathname
            + (parsedURL.search || '');
        return strippedAnchor;
    }
    clientInfo() {
        const version = require('../../package.json').version;
        return `percy-agent/${version}`;
    }
}
exports.default = PercyClientService;
