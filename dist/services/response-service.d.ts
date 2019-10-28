import * as puppeteer from 'puppeteer';
import PercyClientService from './percy-client-service';
import ResourceService from './resource-service';
export default class ResponseService extends PercyClientService {
    resourceService: ResourceService;
    responsesProcessed: Map<string, string>;
    allowedHostnames: string[];
    constructor(buildId: number, allowedHostnames: string[]);
    shouldCaptureResource(rootUrl: string, resourceUrl: string): boolean;
    processResponse(rootResourceUrl: string, response: puppeteer.Response, width: number, logger: any): Promise<any | null>;
    /**
     * Handle processing and saving a resource that has a redirect chain. This
     * will download the resource from node, and save the content as the orignal
     * requesting url. This works since axios follows the redirect chain
     * automatically.
     */
    handleRedirectResouce(originalURL: string, redirectedURL: string, requestHeaders: any, width: number, logger: any): Promise<any>;
    /**
     * Handle processing and saving a resource coming from Puppeteer. This will
     * take the response object from Puppeteer and save the asset locally.
     */
    handlePuppeteerResource(url: string, response: puppeteer.Response, width: number, logger: any): Promise<any>;
    /**
     * Write a local copy of the SHA only if it doesn't exist on the file system
     * already.
     */
    maybeWriteFile(filePath: string, buffer: any): boolean;
    /**
     * Ensures the saved file is not larger than what the Percy API accepts. It
     * returns if the file is too large, as well as the files size.
     */
    checkFileSize(filePath: string): {
        fileIsTooLarge: boolean;
        responseBodySize: number;
    };
}
