"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const logger_1 = require("../utils/logger");
const percy_client_service_1 = require("./percy-client-service");
class ResourceService extends percy_client_service_1.default {
    constructor(buildId) {
        super();
        this.resourcesUploaded = [];
        this.buildId = buildId;
    }
    createResourceFromFile(responseUrl, copyFilePath, contentType = '', logger) {
        const copyFullPath = path.resolve(copyFilePath);
        const sha = path.basename(copyFilePath);
        const resourceUrl = responseUrl;
        logger.debug('creating resource');
        logger.debug(`-> response: ${responseUrl}`);
        logger.debug(`-> copyFilePath: ${copyFilePath}`);
        logger.debug(`-> resourceUrl: ${resourceUrl}`);
        logger.debug(`-> localPath: ${copyFullPath}`);
        logger.debug(`-> sha: ${sha}`);
        logger.debug(`-> contentType: ${contentType}`);
        return this.percyClient.makeResource({
            resourceUrl,
            localPath: copyFullPath,
            sha,
            mimetype: contentType,
        });
    }
    async uploadMissingResources(response, resources) {
        logger_1.profile('-> resourceService.uploadMissingResources');
        const snapshotResponse = {
            buildId: this.buildId,
            response,
            resources,
        };
        try {
            await this.percyClient.uploadMissingResources(snapshotResponse.buildId, snapshotResponse.response, snapshotResponse.resources);
            logger_1.profile('-> resourceService.uploadMissingResources', { resources: resources.length });
            return true;
        }
        catch (error) {
            logger_1.logError(error);
            return false;
        }
    }
}
exports.default = ResourceService;
