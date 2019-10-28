"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const os = require("os");
const path = require("path");
const logger_1 = require("../utils/logger");
const agent_service_constants_1 = require("./agent-service-constants");
const build_service_1 = require("./build-service");
const constants_1 = require("./constants");
const process_service_1 = require("./process-service");
const snapshot_service_1 = require("./snapshot-service");
class AgentService {
    constructor() {
        this.snapshotService = null;
        this.publicDirectory = `${__dirname}/../../dist/public`;
        this.snapshotCreationPromises = [];
        this.snapshotConfig = {};
        this.server = null;
        this.buildId = null;
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(express.static(this.publicDirectory));
        this.app.post(agent_service_constants_1.SNAPSHOT_PATH, this.handleSnapshot.bind(this));
        this.app.post(agent_service_constants_1.STOP_PATH, this.handleStop.bind(this));
        this.app.get(agent_service_constants_1.HEALTHCHECK_PATH, this.handleHealthCheck.bind(this));
        this.buildService = new build_service_1.default();
    }
    async start(configuration) {
        this.snapshotConfig = configuration.snapshot;
        this.buildId = await this.buildService.create();
        if (this.buildId !== null) {
            this.server = this.app.listen(configuration.agent.port);
            this.snapshotService = new snapshot_service_1.default(this.buildId, configuration.agent['asset-discovery']);
            await this.snapshotService.assetDiscoveryService.setup();
            return;
        }
        await this.stop();
    }
    async stop() {
        logger_1.default.info('stopping percy...');
        logger_1.default.info(`waiting for ${this.snapshotCreationPromises.length} snapshots to complete...`);
        await Promise.all(this.snapshotCreationPromises);
        logger_1.default.info('done.');
        if (this.snapshotService) {
            await this.snapshotService.assetDiscoveryService.teardown();
        }
        await this.buildService.finalize();
        if (this.server) {
            await this.server.close();
        }
    }
    async handleSnapshot(request, response) {
        logger_1.profile('agentService.handleSnapshot');
        // truncate domSnapshot for the logs if it's very large
        const rootURL = request.body.url;
        let domSnapshotLog = request.body.domSnapshot;
        if (domSnapshotLog.length > constants_1.default.MAX_LOG_LENGTH) {
            domSnapshotLog = domSnapshotLog.substring(0, constants_1.default.MAX_LOG_LENGTH);
            domSnapshotLog += `[truncated at ${constants_1.default.MAX_LOG_LENGTH}]`;
        }
        const snapshotLog = path.join(os.tmpdir(), `percy.${Date.now()}.log`);
        const snapshotLogger = logger_1.createFileLogger(snapshotLog);
        snapshotLogger.debug('handling snapshot:');
        snapshotLogger.debug(`-> headers: ${JSON.stringify(request.headers)}`);
        snapshotLogger.debug(`-> name: ${request.body.name}`);
        snapshotLogger.debug(`-> url: ${request.body.url}`);
        snapshotLogger.debug(`-> clientInfo: ${request.body.clientInfo}`);
        snapshotLogger.debug(`-> environmentInfo: ${request.body.environmentInfo}`);
        snapshotLogger.debug(`-> domSnapshot: ${domSnapshotLog}`);
        if (!this.snapshotService) {
            return response.json({ success: false });
        }
        // trim the string of whitespace and concat per-snapshot CSS with the globally specified CSS
        const percySpecificCSS = this.snapshotConfig['percy-css'].concat(request.body.percyCSS || '').trim();
        const hasWidths = !!request.body.widths && request.body.widths.length;
        const snapshotOptions = {
            percyCSS: percySpecificCSS,
            requestHeaders: request.body.requestHeaders,
            widths: hasWidths ? request.body.widths : this.snapshotConfig.widths,
            enableJavaScript: request.body.enableJavaScript != null
                ? request.body.enableJavaScript
                : this.snapshotConfig['enable-javascript'],
            minHeight: request.body.minHeight || this.snapshotConfig['min-height'],
        };
        let domSnapshot = request.body.domSnapshot;
        if (domSnapshot.length > constants_1.default.MAX_FILE_SIZE_BYTES) {
            logger_1.default.info(`snapshot skipped[max_file_size_exceeded]: '${request.body.name}'`);
            return response.json({ success: true });
        }
        let resources = await this.snapshotService.buildResources(rootURL, domSnapshot, snapshotOptions, snapshotLogger);
        const percyCSSFileName = `percy-specific.${Date.now()}.css`;
        // Inject the link to the percy specific css if the option is passed
        // This must be done _AFTER_ asset discovery, or you risk their server
        // serving a response for this CSS we're injecting into the DOM
        if (snapshotOptions.percyCSS) {
            const cssLink = `<link data-percy-specific-css rel="stylesheet" href="/${percyCSSFileName}" />`;
            domSnapshot = domSnapshot.replace(/<\/body>/i, cssLink + '$&');
        }
        resources = resources.concat(this.snapshotService.buildRootResource(rootURL, domSnapshot), 
        // @ts-ignore we won't write anything if css is not is passed
        this.snapshotService.buildPercyCSSResource(rootURL, percyCSSFileName, snapshotOptions.percyCSS, snapshotLogger), this.snapshotService.buildLogResource(snapshotLog));
        const snapshotCreation = this.snapshotService.create(request.body.name, resources, snapshotOptions, request.body.clientInfo, request.body.environmentInfo);
        this.snapshotCreationPromises.push(snapshotCreation);
        logger_1.default.info(`snapshot taken: '${request.body.name}'`);
        logger_1.profile('agentService.handleSnapshot');
        return response.json({ success: true });
    }
    async handleStop(_, response) {
        await this.stop();
        new process_service_1.default().kill();
        return response.json({ success: true });
    }
    async handleHealthCheck(_, response) {
        return response.json({ success: true });
    }
}
exports.AgentService = AgentService;
