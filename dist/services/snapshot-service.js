"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const url_1 = require("url");
const logger_1 = require("../utils/logger");
const asset_discovery_service_1 = require("./asset-discovery-service");
const percy_client_service_1 = require("./percy-client-service");
const resource_service_1 = require("./resource-service");
class SnapshotService extends percy_client_service_1.default {
    constructor(buildId, configuration) {
        super();
        this.buildId = buildId;
        this.resourceService = new resource_service_1.default(buildId);
        this.assetDiscoveryService = new asset_discovery_service_1.AssetDiscoveryService(buildId, configuration);
    }
    buildResources(rootResourceUrl, domSnapshot = '', options, logger) {
        return this.assetDiscoveryService.discoverResources(rootResourceUrl, domSnapshot, options, logger);
    }
    buildRootResource(rootResourceUrl, domSnapshot = '') {
        return this.percyClient.makeResource({
            resourceUrl: rootResourceUrl,
            content: domSnapshot,
            isRoot: true,
            mimetype: 'text/html',
        });
    }
    buildLogResource(logFilePath) {
        const fileName = path.basename(logFilePath);
        const buffer = fs.readFileSync(path.resolve(logFilePath));
        const sha = crypto.createHash('sha256').update(buffer).digest('hex');
        const localPath = path.join(os.tmpdir(), sha);
        // copy the file to prevent further logs from being written
        if (!fs.existsSync(localPath)) {
            fs.writeFileSync(localPath, buffer);
        }
        return this.percyClient.makeResource({
            resourceUrl: `/${fileName}`,
            mimetype: 'text/plain',
            localPath,
            sha,
        });
    }
    buildPercyCSSResource(url, fileName, css, logger) {
        if (!css) {
            return [];
        }
        const parsedRootResourceUrl = new url_1.URL(url);
        const rootURL = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.host}`;
        logger.debug(`Creating Percy Specific file: ${fileName}. Root URL: ${rootURL}. CSS string: ${css}`);
        const buffer = Buffer.from(css, 'utf8');
        const sha = crypto.createHash('sha256').update(buffer).digest('hex');
        const localPath = path.join(os.tmpdir(), sha);
        // write the SHA file if it doesn't exist
        if (!fs.existsSync(localPath)) {
            fs.writeFileSync(localPath, buffer, 'utf8');
        }
        else {
            logger.debug(`Skipping writing Percy specific file: ${fileName}.`);
        }
        return this.percyClient.makeResource({
            resourceUrl: `${rootURL}/${fileName}`,
            mimetype: 'text/css',
            localPath,
            sha,
        });
    }
    create(name, resources, options = {}, clientInfo = null, environmentInfo = null) {
        const snapshotCreationPromise = this.percyClient.createSnapshot(this.buildId, resources, Object.assign({ name }, options, { minimumHeight: options.minHeight, clientInfo, environmentInfo })).then(async (response) => {
            await this.resourceService.uploadMissingResources(response, resources);
            return response;
        }).then(async (response) => {
            const snapshotId = response.body.data.id;
            logger_1.profile('-> snapshotService.finalizeSnapshot');
            await this.finalize(response.body.data.id);
            logger_1.profile('-> snapshotService.finalizeSnapshot', { snapshotId });
            return response;
        }).catch(logger_1.logError);
        return snapshotCreationPromise;
    }
    async finalize(snapshotId) {
        try {
            await this.percyClient.finalizeSnapshot(snapshotId);
            return true;
        }
        catch (error) {
            logger_1.logError(error);
            return false;
        }
    }
}
exports.default = SnapshotService;
