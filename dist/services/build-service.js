"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors");
const logger_1 = require("../utils/logger");
const percy_client_service_1 = require("./percy-client-service");
class BuildService extends percy_client_service_1.default {
    constructor() {
        super(...arguments);
        this.buildUrl = null;
        this.buildNumber = null;
        this.buildId = null;
    }
    async create() {
        try {
            const build = await this.percyClient
                .createBuild();
            const buildData = build.body.data;
            this.buildId = parseInt(buildData.id);
            this.buildNumber = parseInt(buildData.attributes['build-number']);
            this.buildUrl = buildData.attributes['web-url'];
            this.logEvent('created');
            return this.buildId;
        }
        catch (e) {
            logger_1.logError(e);
        }
        return null;
    }
    async finalize() {
        if (!this.buildId) {
            return;
        }
        await this.percyClient.finalizeBuild(this.buildId).catch(logger_1.logError);
        this.logEvent('finalized');
    }
    async finalizeAll() {
        process.env.PERCY_PARALLEL_TOTAL = '-1';
        const build = await this.percyClient.createBuild().catch(logger_1.logError);
        const buildId = parseInt(build.body.data.id);
        const result = await this.percyClient.finalizeBuild(buildId, { allShards: true }).catch(logger_1.logError);
        if (result) {
            return build;
        }
    }
    logEvent(event) {
        logger_1.default.info(`${event} build #${this.buildNumber}: ` + colors.blue(`${this.buildUrl}`));
    }
}
exports.default = BuildService;
