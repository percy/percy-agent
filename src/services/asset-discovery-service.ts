import * as puppeteer from 'puppeteer'
import { SnapshotOptions } from '../percy-agent-client/snapshot-options'
import logger, {logError, profile} from '../utils/logger'
import waitForNetworkIdle from '../utils/wait-for-network-idle'
import PercyClientService from './percy-client-service'
import ResponseService from './response-service'

interface AssetDiscoveryOptions {
  networkIdleTimeout?: number
}

export default class AssetDiscoveryService extends PercyClientService {
  responseService: ResponseService
  browser: puppeteer.Browser | null
  pages: puppeteer.Page[] | null

  readonly DEFAULT_NETWORK_IDLE_TIMEOUT: number = 50 // ms
  networkIdleTimeout: number // ms

  // How many 'pages' (i.e. tabs) we'll keep around.
  // We will only be able to process at most these many snapshot widths.
  readonly PAGE_POOL_SIZE: number = 10

  // Default widths to use for asset discovery. Must match Percy service defaults.
  readonly DEFAULT_WIDTHS: number[] = [1280, 375]

  constructor(buildId: number, options: AssetDiscoveryOptions = {}) {
    super()
    this.responseService = new ResponseService(buildId)
    this.networkIdleTimeout = options.networkIdleTimeout || this.DEFAULT_NETWORK_IDLE_TIMEOUT
    this.browser = null
    this.pages = null
  }

  async setup() {
    profile('-> assetDiscoveryService.puppeteer.launch')
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false,
    })
    profile('-> assetDiscoveryService.puppeteer.launch')

    profile('-> assetDiscoveryService.browser.newPagePool')
    const pagePromises: Array<Promise<puppeteer.Page>> = []
    for (let i = 0; i < this.PAGE_POOL_SIZE; i++) {
      const promise = this.browser.newPage().then((page) => {
        return page.setRequestInterception(true).then(() => page)
      })
      pagePromises.push(promise)
    }
    this.pages = await Promise.all(pagePromises)
    profile('-> assetDiscoveryService.browser.newPagePool')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string, options: SnapshotOptions): Promise<any[]> {
    profile('-> assetDiscoveryService.discoverResources')

    if (!this.browser || !this.pages || !this.pages.length) {
      logger.error('Puppeteer failed to open with a page pool.')
      return []
    }

    if (options.widths && options.widths.length > this.pages.length) {
      logger.error(`Too many widths requested. Max allowed is ${this.PAGE_POOL_SIZE}. Requested: ${options.widths}`)
      return []
    }

    rootResourceUrl = this.parseRequestPath(rootResourceUrl)

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    const enableJavaScript = options.enableJavaScript || false
    const widths = options.widths || this.DEFAULT_WIDTHS

    // Do asset discovery for each requested width in parallel. We don't keep track of which page
    // is doing work, and instead rely on the fact that we always have fewer widths to work on than
    // the number of pages in our pool. If we wanted to do something smarter here, we should consider
    // switching to use puppeteer-cluster instead.
    profile('--> assetDiscoveryService.discoverForWidths', {url: rootResourceUrl})
    const resourcePromises: Array<Promise<any[]>> = []
    for (let idx = 0; idx < widths.length; idx++) {
      const promise = this.resourcesForWidth(
        this.pages[idx], widths[idx], domSnapshot, rootResourceUrl, enableJavaScript)
      resourcePromises.push(promise)
    }
    const resourceArrays: any[][] = await Promise.all(resourcePromises)
    let resources: any[] = ([] as any[]).concat(...resourceArrays)
    profile('--> assetDiscoveryService.discoverForWidths')

    const resourceUrls: string[] = []

    // Dedup by resourceUrl as they must be unique when sent to Percy API down the line.
    resources = resources.filter((resource: any) => {
      if (!resourceUrls.includes(resource.resourceUrl)) {
        resourceUrls.push(resource.resourceUrl as string)
        return true
      }
      return false
    })

    profile('-> assetDiscoveryService.discoverResources', {resourcesDiscovered: resources.length})

    return resources
  }

  shouldRequestResolve(request: puppeteer.Request) {
    const requestPurpose = request.headers().purpose

    switch (requestPurpose) {
      case 'prefetch':
      case 'preload':
      case 'dns-prefetch':
      case 'prerender':
      case 'preconnect':
      case 'subresource':
        return false
      default:
        return true
    }
  }

  async teardown() {
    await this.closePages()
    await this.closeBrowser()
  }

  private async resourcesForWidth(page: puppeteer.Page, width: number, domSnapshot: string,
                                  rootResourceUrl: string, enableJavaScript: boolean): Promise<any[]> {
    logger.debug(`discovering assets for width: ${width}`)

    await page.setJavaScriptEnabled(enableJavaScript)
    await page.setViewport(Object.assign(page.viewport(), {width}))

    page.on('request', async (request) => {
      if (!this.shouldRequestResolve(request)) {
        await request.abort()
        return
      }

      if (request.url() === rootResourceUrl) {
        await request.respond({
          body: domSnapshot,
          contentType: 'text/html',
          status: 200,
        })
        return
      }

      await request.continue()
    })

    const maybeResourcePromises: Array<Promise<any>> = []
    await page.on('response', async (response) => {
      // Parallelize the work in processResponse as much as possible, but make sure to
      // wait for it to complete before returning from the asset discovery phase.
      const promise = this.responseService.processResponse(rootResourceUrl, response, width)
      promise.catch(logError)
      maybeResourcePromises.push(promise)
    })

    profile('--> assetDiscoveryService.page.goto', {url: rootResourceUrl})
    await page.goto(rootResourceUrl)
    profile('--> assetDiscoveryService.page.goto')

    profile('--> assetDiscoveryService.waitForNetworkIdle')
    await waitForNetworkIdle(page, this.networkIdleTimeout).catch(logError)
    profile('--> assetDiscoveryService.waitForNetworkIdle')

    page.removeAllListeners()

    profile('--> assetDiscoveryServer.waitForResourceProcessing')
    const maybeResources: any[] = await Promise.all(maybeResourcePromises)
    profile('--> assetDiscoveryServer.waitForResourceProcessing')
    return maybeResources.filter((maybeResource) => maybeResource != null)
  }

  private async closeBrowser() {
    if (!this.browser) { return }
    await this.browser.close()
    this.browser = null
  }

  private async closePages() {
    if (!this.pages) { return }
    await Promise.all(this.pages.map((page) => page.close()))
    this.pages = null
  }
}
