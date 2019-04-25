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

  readonly DEFAULT_NETWORK_IDLE_TIMEOUT: number = 50 // ms
  networkIdleTimeout: number // ms

  readonly MAX_SNAPSHOT_WIDTHS: number = 10

  // Default widths to use for asset discovery. Must match Percy service defaults.
  readonly DEFAULT_WIDTHS: number[] = [1280, 375]

  constructor(buildId: number, options: AssetDiscoveryOptions = {}) {
    super()
    this.responseService = new ResponseService(buildId)
    this.networkIdleTimeout = options.networkIdleTimeout || this.DEFAULT_NETWORK_IDLE_TIMEOUT
    this.browser = null
  }

  async setup() {
    profile('-> assetDiscoveryService.puppeteer.launch')
    this.browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-web-security',
      ],
      ignoreHTTPSErrors: true,
      handleSIGINT : false,
    })
    profile('-> assetDiscoveryService.puppeteer.launch')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string, options: SnapshotOptions): Promise<any[]> {
    profile('-> assetDiscoveryService.discoverResources')

    if (!this.browser) {
      logger.error('Puppeteer failed to open browser.')
      return []
    }

    if (options.widths && options.widths.length > this.MAX_SNAPSHOT_WIDTHS) {
      logger.error(`Too many widths requested. Max is ${this.MAX_SNAPSHOT_WIDTHS}. Requested: ${options.widths}`)
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
    for (const width of widths) {
      const promise = this.resourcesForWidth(
        this.browser, width, domSnapshot, rootResourceUrl, enableJavaScript)
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
    await this.closeBrowser()
  }

  private async resourcesForWidth(browser: puppeteer.Browser, width: number, domSnapshot: string,
                                  rootResourceUrl: string, enableJavaScript: boolean): Promise<any[]> {
    logger.debug(`discovering assets for width: ${width}`)

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setJavaScriptEnabled(enableJavaScript)
    await page.setViewport(Object.assign(page.viewport(), {width}))

    page.on('request', async (request) => {
      try {
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
      } catch (error) {
        logError(error)
      }
    })

    const maybeResourcePromises: Array<Promise<any>> = []
    // Listen on 'requestfinished', which tells us a request completed successfully.
    // We could also listen on 'response', but then we'd have to check if it was successful.
    page.on('requestfinished', async (request) => {
      const response = request.response()
      if (response) {
        // Parallelize the work in processResponse as much as possible, but make sure to
        // wait for it to complete before returning from the asset discovery phase.
        const promise = this.responseService.processResponse(rootResourceUrl, response, width)
        promise.catch(logError)
        maybeResourcePromises.push(promise)
      } else {
        logger.debug(`No response for ${request.url()}. Skipping.`)
      }
    })

    // Debug log failed requests.
    page.on('requestfailed', async (request) => {
      logger.debug(`Failed to load ${request.url()} : ${request.failure()!.errorText}}`)
    })

    try {
      profile('--> assetDiscoveryService.page.goto', {url: rootResourceUrl})
      await page.goto(rootResourceUrl)
      profile('--> assetDiscoveryService.page.goto')

      profile('--> assetDiscoveryService.waitForNetworkIdle')
      await waitForNetworkIdle(page, this.networkIdleTimeout)
      profile('--> assetDiscoveryService.waitForNetworkIdle')

      profile('--> assetDiscoveryServer.waitForResourceProcessing')
      const maybeResources: any[] = await Promise.all(maybeResourcePromises)
      profile('--> assetDiscoveryServer.waitForResourceProcessing')

      profile('--> assetDiscoveryService.page.close', {url: rootResourceUrl})
      await page.close()
      profile('--> assetDiscoveryService.page.close')

      return maybeResources.filter((maybeResource) => maybeResource != null)
    } catch (error) {
      logError(error)
    }

    return []
  }

  private async closeBrowser() {
    if (!this.browser) { return }
    await this.browser.close()
    this.browser = null
  }
}
