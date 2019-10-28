"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("deepmerge");
const pool = require("generic-pool");
const puppeteer = require("puppeteer");
const configuration_1 = require("../configuration/configuration");
const logger_1 = require("../utils/logger");
const wait_for_network_idle_1 = require("../utils/wait-for-network-idle");
const percy_client_service_1 = require("./percy-client-service");
const response_service_1 = require("./response-service");
exports.MAX_SNAPSHOT_WIDTHS = 10;
class AssetDiscoveryService extends percy_client_service_1.default {
    constructor(buildId, configuration) {
        super();
        this.browser = null;
        this.pagePool = null;
        this.configuration = configuration || configuration_1.DEFAULT_CONFIGURATION.agent['asset-discovery'];
        this.responseService = new response_service_1.default(buildId, this.configuration['allowed-hostnames']);
    }
    async setup() {
        logger_1.profile('-> assetDiscoveryService.setup');
        const browser = this.browser = await this.createBrowser();
        this.pagePool = await this.createPagePool(() => {
            return this.createPage(browser);
        }, this.configuration['page-pool-size-min'], this.configuration['page-pool-size-max']);
        logger_1.profile('-> assetDiscoveryService.setup');
    }
    async createBrowser() {
        logger_1.profile('-> assetDiscoveryService.puppeteer.launch');
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-web-security',
            ],
            ignoreHTTPSErrors: true,
            handleSIGINT: false,
        });
        logger_1.profile('-> assetDiscoveryService.puppeteer.launch');
        return browser;
    }
    async createPagePool(exec, min, max) {
        logger_1.profile('-> assetDiscoveryService.createPagePool');
        const result = pool.createPool({
            create() {
                return exec();
            },
            destroy(page) {
                return page.close();
            },
        }, { min, max });
        logger_1.profile('-> assetDiscoveryService.createPagePool');
        return result;
    }
    async createPage(browser) {
        logger_1.profile('-> assetDiscoveryService.browser.newPage');
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        logger_1.profile('-> assetDiscoveryService.browser.newPage');
        return page;
    }
    async discoverResources(rootResourceUrl, domSnapshot, options, logger) {
        logger_1.profile('-> assetDiscoveryService.discoverResources');
        if (this.browser === null) {
            logger.error('Puppeteer failed to open browser.');
            return [];
        }
        if (!this.pagePool) {
            logger.error('Failed to create pool of pages.');
            return [];
        }
        if (options.widths && options.widths.length > exports.MAX_SNAPSHOT_WIDTHS) {
            logger.error(`Too many widths requested. Max is ${exports.MAX_SNAPSHOT_WIDTHS}. Requested: ${options.widths}`);
            return [];
        }
        rootResourceUrl = this.parseRequestPath(rootResourceUrl);
        logger.debug(`discovering assets for URL: ${rootResourceUrl}`);
        const { enableJavaScript = false, widths = configuration_1.DEFAULT_CONFIGURATION.snapshot.widths, requestHeaders, } = options;
        // Do asset discovery for each requested width in parallel. We don't keep track of which page
        // is doing work, and instead rely on the fact that we always have fewer widths to work on than
        // the number of pages in our pool. If we wanted to do something smarter here, we should consider
        // switching to use puppeteer-cluster instead.
        logger_1.profile('--> assetDiscoveryService.discoverForWidths', { url: rootResourceUrl });
        let resources = [].concat(...(await Promise.all(widths.map((width) => this.resourcesForWidth(
        // @ts-ignore - for some reason, ts thinks we're assigning null here
        this.pagePool, width, domSnapshot, rootResourceUrl, enableJavaScript, requestHeaders, logger)))));
        logger_1.profile('--> assetDiscoveryService.discoverForWidths');
        const resourceUrls = [];
        // Dedup by resourceUrl as they must be unique when sent to Percy API down the line.
        resources = resources.filter((resource) => {
            if (!resourceUrls.includes(resource.resourceUrl)) {
                resourceUrls.push(resource.resourceUrl);
                return true;
            }
            return false;
        });
        logger_1.profile('-> assetDiscoveryService.discoverResources', { resourcesDiscovered: resources.length });
        return resources;
    }
    shouldRequestResolve(request) {
        const requestPurpose = request.headers().purpose;
        switch (requestPurpose) {
            case 'prefetch':
            case 'preload':
            case 'dns-prefetch':
            case 'prerender':
            case 'preconnect':
            case 'subresource':
                return false;
            default:
                return true;
        }
    }
    async teardown() {
        await this.cleanPagePool();
        await this.closeBrowser();
    }
    async resourcesForWidth(pool, width, domSnapshot, rootResourceUrl, enableJavaScript, requestHeaders = {}, logger) {
        logger.debug(`discovering assets for width: ${width}`);
        logger_1.profile('--> assetDiscoveryService.pool.acquire', { url: rootResourceUrl });
        const page = await pool.acquire();
        logger_1.profile('--> assetDiscoveryService.pool.acquire');
        await page.setJavaScriptEnabled(enableJavaScript);
        await page.setViewport(Object.assign(page.viewport(), { width }));
        await page.setExtraHTTPHeaders(merge.all([
            this.configuration['request-headers'],
            requestHeaders,
        ]));
        page.on('request', async (request) => {
            try {
                if (!this.shouldRequestResolve(request)) {
                    await request.abort();
                    return;
                }
                if (request.url() === rootResourceUrl) {
                    await request.respond({
                        body: domSnapshot,
                        contentType: 'text/html',
                        status: 200,
                    });
                    return;
                }
                await request.continue();
            }
            catch (error) {
                logger_1.logError(error);
            }
        });
        const maybeResourcePromises = [];
        // Listen on 'requestfinished', which tells us a request completed successfully.
        // We could also listen on 'response', but then we'd have to check if it was successful.
        page.on('requestfinished', async (request) => {
            const response = request.response();
            if (response) {
                // Parallelize the work in processResponse as much as possible, but make sure to
                // wait for it to complete before returning from the asset discovery phase.
                const promise = this.responseService.processResponse(rootResourceUrl, response, width, logger);
                promise.catch(logger_1.logError);
                maybeResourcePromises.push(promise);
            }
            else {
                logger.debug(`No response for ${request.url()}. Skipping.`);
            }
        });
        // Debug log failed requests.
        page.on('requestfailed', async (request) => {
            logger.debug(`Failed to load ${request.url()} : ${request.failure().errorText}}`);
        });
        let maybeResources = [];
        try {
            logger_1.profile('--> assetDiscoveryService.page.goto', { url: rootResourceUrl });
            await page.goto(rootResourceUrl);
            logger_1.profile('--> assetDiscoveryService.page.goto');
            logger_1.profile('--> assetDiscoveryService.waitForNetworkIdle');
            await wait_for_network_idle_1.default(page, this.configuration['network-idle-timeout']);
            logger_1.profile('--> assetDiscoveryService.waitForNetworkIdle');
            logger_1.profile('--> assetDiscoveryServer.waitForResourceProcessing');
            maybeResources = await Promise.all(maybeResourcePromises);
            logger_1.profile('--> assetDiscoveryServer.waitForResourceProcessing');
        }
        catch (error) {
            logger.error(`${error.name} ${error.message}`);
            logger.debug(error);
        }
        // always release the page from the pool
        logger_1.profile('--> assetDiscoveryService.pool.release', { url: rootResourceUrl });
        page.removeAllListeners('request');
        page.removeAllListeners('requestfinished');
        page.removeAllListeners('requestfailed');
        await pool.release(page);
        logger_1.profile('--> assetDiscoveryService.pool.release');
        return maybeResources.filter(Boolean);
    }
    async cleanPagePool() {
        if (this.pagePool === null) {
            return;
        }
        await this.pagePool.drain();
        await this.pagePool.clear();
        this.pagePool = null;
    }
    async closeBrowser() {
        if (this.browser === null) {
            return;
        }
        await this.browser.close();
        this.browser = null;
    }
}
exports.AssetDiscoveryService = AssetDiscoveryService;
