import * as puppeteer from 'puppeteer';
declare function waitForNetworkIdle(page: puppeteer.Page, timeout?: number, maxInflightRequests?: number): Promise<unknown>;
export default waitForNetworkIdle;
