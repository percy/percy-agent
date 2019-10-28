"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
// @ts-ignore
const followRedirects = require("follow-redirects");
const fs = require("fs");
const os = require("os");
const path = require("path");
const url_1 = require("url");
const domain_match_1 = require("../utils/domain-match");
const constants_1 = require("./constants");
const percy_client_service_1 = require("./percy-client-service");
const resource_service_1 = require("./resource-service");
const REDIRECT_STATUSES = [301, 302, 304, 307, 308];
const ALLOWED_RESPONSE_STATUSES = [200, 201, ...REDIRECT_STATUSES];
class ResponseService extends percy_client_service_1.default {
    constructor(buildId, allowedHostnames) {
        super();
        this.responsesProcessed = new Map();
        this.resourceService = new resource_service_1.default(buildId);
        this.allowedHostnames = allowedHostnames;
    }
    shouldCaptureResource(rootUrl, resourceUrl) {
        // Capture if the resourceUrl is the same as the rootUrL
        if (resourceUrl.startsWith(rootUrl)) {
            return true;
        }
        // Capture if the resourceUrl has a hostname in the allowedHostnames
        if (this.allowedHostnames.some((hostname) => domain_match_1.default(hostname, resourceUrl))) {
            return true;
        }
        // Resource is not allowed
        return false;
    }
    async processResponse(rootResourceUrl, response, width, logger) {
        logger.debug(`processing response: ${response.url()} for width: ${width}`);
        const url = this.parseRequestPath(response.url());
        // skip responses already processed
        const processResponse = this.responsesProcessed.get(url);
        if (processResponse) {
            return processResponse;
        }
        const request = response.request();
        const parsedRootResourceUrl = new url_1.URL(rootResourceUrl);
        const isRedirect = REDIRECT_STATUSES.includes(response.status());
        const rootUrl = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.host}`;
        if (request.url() === rootResourceUrl) {
            // Always skip the root resource
            logger.debug(`Skipping [is_root_resource]: ${request.url()}`);
            return;
        }
        if (!ALLOWED_RESPONSE_STATUSES.includes(response.status())) {
            // Only allow 2XX responses:
            logger.debug(`Skipping [disallowed_response_status_${response.status()}] [${width} px]: ${response.url()}`);
            return;
        }
        if (!this.shouldCaptureResource(rootUrl, request.url())) {
            // Disallow remote resource requests.
            logger.debug(`Skipping [is_remote_resource] [${width} px]: ${request.url()}`);
            return;
        }
        if (isRedirect) {
            // We don't want to follow too deep of a chain
            // `followRedirects` is the npm package axios uses to follow redirected requests
            // we'll use their max redirect setting as a guard here
            if (request.redirectChain().length > followRedirects.maxRedirects) {
                logger.debug(`Skipping [redirect_too_deep: ${request.redirectChain().length}] [${width} px]: ${response.url()}`);
                return;
            }
            const redirectedURL = `${rootUrl}${response.headers().location}`;
            return this.handleRedirectResouce(url, redirectedURL, request.headers(), width, logger);
        }
        return this.handlePuppeteerResource(url, response, width, logger);
    }
    /**
     * Handle processing and saving a resource that has a redirect chain. This
     * will download the resource from node, and save the content as the orignal
     * requesting url. This works since axios follows the redirect chain
     * automatically.
     */
    async handleRedirectResouce(originalURL, redirectedURL, requestHeaders, width, logger) {
        logger.debug(`Making local copy of redirected response: ${originalURL}`);
        try {
            const { data, headers } = await axios_1.default(originalURL, {
                responseType: 'arraybuffer',
                headers: requestHeaders,
            });
            const buffer = Buffer.from(data);
            const sha = crypto.createHash('sha256').update(buffer).digest('hex');
            const localCopy = path.join(os.tmpdir(), sha);
            const didWriteFile = this.maybeWriteFile(localCopy, buffer);
            const { fileIsTooLarge, responseBodySize } = this.checkFileSize(localCopy);
            if (!didWriteFile) {
                logger.debug(`Skipping file copy [already_copied]: ${originalURL}`);
            }
            if (fileIsTooLarge) {
                logger.debug(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${originalURL}`);
                return;
            }
            const contentType = headers['content-type'];
            const resource = this.resourceService.createResourceFromFile(originalURL, localCopy, contentType, logger);
            this.responsesProcessed.set(originalURL, resource);
            this.responsesProcessed.set(redirectedURL, resource);
            return resource;
        }
        catch (err) {
            logger.debug(`${err}`);
            logger.debug(`Failed to make a local copy of redirected response: ${originalURL}`);
            return;
        }
    }
    /**
     * Handle processing and saving a resource coming from Puppeteer. This will
     * take the response object from Puppeteer and save the asset locally.
     */
    async handlePuppeteerResource(url, response, width, logger) {
        logger.debug(`Making local copy of response: ${response.url()}`);
        const buffer = await response.buffer();
        const sha = crypto.createHash('sha256').update(buffer).digest('hex');
        const localCopy = path.join(os.tmpdir(), sha);
        const didWriteFile = this.maybeWriteFile(localCopy, buffer);
        if (!didWriteFile) {
            logger.debug(`Skipping file copy [already_copied]: ${response.url()}`);
        }
        const contentType = response.headers()['content-type'];
        const { fileIsTooLarge, responseBodySize } = this.checkFileSize(localCopy);
        if (fileIsTooLarge) {
            logger.debug(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${response.url()}`);
            return;
        }
        const resource = this.resourceService.createResourceFromFile(url, localCopy, contentType, logger);
        this.responsesProcessed.set(url, resource);
        return resource;
    }
    /**
     * Write a local copy of the SHA only if it doesn't exist on the file system
     * already.
     */
    maybeWriteFile(filePath, buffer) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, buffer);
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Ensures the saved file is not larger than what the Percy API accepts. It
     * returns if the file is too large, as well as the files size.
     */
    checkFileSize(filePath) {
        const responseBodySize = fs.statSync(filePath).size;
        const fileIsTooLarge = responseBodySize > constants_1.default.MAX_FILE_SIZE_BYTES;
        return { fileIsTooLarge, responseBodySize };
    }
}
exports.default = ResponseService;
