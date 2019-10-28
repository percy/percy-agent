"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const globby = require("globby");
const puppeteer = require("puppeteer");
const configuration_1 = require("../configuration/configuration");
const logger_1 = require("../utils/logger");
const sdk_utils_1 = require("../utils/sdk-utils");
class StaticSnapshotService {
    constructor(configuration) {
        this.server = null;
        this.app = express();
        this.configuration = configuration || configuration_1.DEFAULT_CONFIGURATION['static-snapshots'];
        this.app.use(cors());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(this.configuration['base-url'], express.static(this.configuration.path));
    }
    async start() {
        logger_1.default.info(`serving static site at ${this._buildLocalUrl()}`);
        this.server = await this.app.listen(this.configuration.port);
    }
    async snapshotAll() {
        logger_1.default.debug('taking snapshots of static site');
        const browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            handleSIGINT: false,
        });
        const percyAgentClientFilename = sdk_utils_1.agentJsFilename();
        const page = await browser.newPage();
        // Do not follow redirects to ensure we don't navigate to another page
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.isNavigationRequest() && request.redirectChain().length) {
                logger_1.default.debug(`Skipping redirect: ${request.url()}`);
                request.abort();
            }
            else {
                request.continue();
            }
        });
        const pageUrls = await this._buildPageUrls();
        for (const url of pageUrls) {
            logger_1.default.debug(`visiting ${url}`);
            try {
                await page.goto(url, { waitUntil: 'networkidle2' });
            }
            catch (error) {
                logger_1.default.error(`Failed to navigate to ${url}, skipping. Error: ${error}`);
            }
            try {
                await page.addScriptTag({
                    path: percyAgentClientFilename,
                });
                await page.evaluate((url) => {
                    const percyAgentClient = new PercyAgent();
                    const parsedURL = new URL(url);
                    const snapshotName = parsedURL.pathname || url;
                    return percyAgentClient.snapshot(snapshotName);
                }, url);
            }
            catch (error) {
                logger_1.default.error(`Failed to inject agent JS: ${error}`);
            }
        }
        await browser.close();
    }
    async stop() {
        if (this.server) {
            await this.server.close();
        }
        logger_1.default.info(`shutting down static site at ${this._buildLocalUrl()}`);
    }
    _buildLocalUrl() {
        return `http://localhost:${this.configuration.port}${this.configuration['base-url']}`;
    }
    async _buildPageUrls() {
        // We very intentially remove '' values from these globs because that matches every file
        const ignoreGlobs = this.configuration['ignore-files']
            .split(',')
            .filter((value) => value !== '');
        const snapshotGlobs = this.configuration['snapshot-files']
            .split(',')
            .filter((value) => value !== '');
        const globOptions = {
            cwd: this.configuration.path,
            ignore: ignoreGlobs,
        };
        const paths = await globby(snapshotGlobs, globOptions);
        const pageUrls = [];
        const baseUrl = this._buildLocalUrl();
        for (const path of paths) {
            pageUrls.push(baseUrl + path);
        }
        return pageUrls;
    }
}
exports.default = StaticSnapshotService;
