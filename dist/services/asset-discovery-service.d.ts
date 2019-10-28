import * as pool from 'generic-pool';
import * as puppeteer from 'puppeteer';
import { AssetDiscoveryConfiguration } from '../configuration/asset-discovery-configuration';
import { SnapshotOptions } from '../percy-agent-client/snapshot-options';
import PercyClientService from './percy-client-service';
import ResponseService from './response-service';
export declare const MAX_SNAPSHOT_WIDTHS: number;
export declare class AssetDiscoveryService extends PercyClientService {
    responseService: ResponseService;
    browser: puppeteer.Browser | null;
    pagePool: pool.Pool<puppeteer.Page> | null;
    configuration: AssetDiscoveryConfiguration;
    constructor(buildId: number, configuration?: AssetDiscoveryConfiguration);
    setup(): Promise<void>;
    createBrowser(): Promise<puppeteer.Browser>;
    createPagePool(exec: () => PromiseLike<puppeteer.Page>, min: number, max: number): Promise<pool.Pool<puppeteer.Page>>;
    createPage(browser: puppeteer.Browser): Promise<puppeteer.Page>;
    discoverResources(rootResourceUrl: string, domSnapshot: string, options: SnapshotOptions, logger: any): Promise<any[]>;
    shouldRequestResolve(request: puppeteer.Request): boolean;
    teardown(): Promise<void>;
    private resourcesForWidth;
    private cleanPagePool;
    private closeBrowser;
}
