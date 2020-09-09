import * as merge from 'deepmerge'
import * as pool from 'generic-pool'
import * as puppeteer from 'puppeteer'
import { URL } from 'url'
import { AssetDiscoveryConfiguration } from '../configuration/asset-discovery-configuration'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import { SnapshotOptions } from '../percy-agent-client/snapshot-options'
import domainMatch from '../utils/domain-match'
import { addLogDate, logError, profile } from '../utils/logger'
import { cacheResponse, getResponseCache } from '../utils/response-cache'
import waitForNetworkIdle from '../utils/wait-for-network-idle'
import PercyClientService from './percy-client-service'
import ResponseService from './response-service'

export const MAX_SNAPSHOT_WIDTHS: number = 10

export class AssetDiscoveryService extends PercyClientService {
  responseService: ResponseService
  browser: puppeteer.Browser | null
  pagePool: pool.Pool<puppeteer.Page> | null

  configuration: AssetDiscoveryConfiguration

  constructor(buildId: number, configuration?: AssetDiscoveryConfiguration) {
    super()
    this.browser = null
    this.pagePool = null

    this.configuration = configuration ||
      DEFAULT_CONFIGURATION.agent['asset-discovery']

    this.responseService = new ResponseService(
      buildId,
      this.configuration['allowed-hostnames'],
      this.configuration['cache-responses']
    )
  }

  async setup() {
    profile('-> assetDiscoveryService.setup')

    const browser = this.browser = await this.createBrowser()
    this.pagePool = await this.createPagePool(() => {
      return this.createPage(browser)
    }, this.configuration['page-pool-size-min'],
       this.configuration['page-pool-size-max'])
    profile('-> assetDiscoveryService.setup')
  }

  async createBrowser() {
    profile('-> assetDiscoveryService.puppeteer.launch')
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-web-security',
      ],
      ignoreHTTPSErrors: true,
      handleSIGINT : false,
    })
    profile('-> assetDiscoveryService.puppeteer.launch')

    return browser
  }

  async createPagePool(exec: () => PromiseLike<puppeteer.Page>, min: number, max: number) {
    profile('-> assetDiscoveryService.createPagePool')
    const result = pool.createPool<puppeteer.Page>({
      create() {
        return exec()
      },
      destroy(page) {
        return page.close()
      },
    }, { min, max })
    profile('-> assetDiscoveryService.createPagePool')

    return result
  }

  async createPage(browser: puppeteer.Browser) {
    profile('-> assetDiscoveryService.browser.newPage')
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    profile('-> assetDiscoveryService.browser.newPage')

    return page
  }

  async discoverResources(
    rootResourceUrl: string,
    domSnapshot: string,
    options: SnapshotOptions,
    logger: any,
  ): Promise<any[]> {
    profile('-> assetDiscoveryService.discoverResources')

    if (this.browser === null) {
      logger.error('Puppeteer failed to open browser.')
      return []
    }

    if (!this.pagePool) {
      logger.error('Failed to create pool of pages.')
      return []
    }

    if (options.widths && options.widths.length > MAX_SNAPSHOT_WIDTHS) {
      logger.error(`Too many widths requested. Max is ${MAX_SNAPSHOT_WIDTHS}. Requested: ${options.widths}`)
      return []
    }

    rootResourceUrl = this.parseRequestPath(rootResourceUrl)

    logger.debug(addLogDate(`discovering assets for URL: ${rootResourceUrl}`))

    const {
      enableJavaScript = false,
      widths = DEFAULT_CONFIGURATION.snapshot.widths,
      requestHeaders,
    } = options

    // Do asset discovery for each requested width in parallel. We don't keep track of which page
    // is doing work, and instead rely on the fact that we always have fewer widths to work on than
    // the number of pages in our pool. If we wanted to do something smarter here, we should consider
    // switching to use puppeteer-cluster instead.
    profile('--> assetDiscoveryService.discoverForWidths', { url: rootResourceUrl })

    let resources: any[] = [].concat(...(await Promise.all(
      widths.map((width: number) => this.resourcesForWidth(
        // @ts-ignore - for some reason, ts thinks we're assigning null here
        this.pagePool,
        width,
        domSnapshot,
        rootResourceUrl,
        enableJavaScript,
        requestHeaders,
        logger,
      )),
    )) as any[])

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

    profile('-> assetDiscoveryService.discoverResources', { resourcesDiscovered: resources.length })

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
    await this.cleanPagePool()
    await this.closeBrowser()
  }

  // We shouldn't bother passing on requests that will never be saved
  shouldProcessRequest(resourceUrl: string, rootResourceUrl: string): boolean {
    const parsedRootResourceUrl = new URL(rootResourceUrl)
    const rootUrl = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.host}`

    // Only capture resources with a proper protocol we support capturing
    if ((/^https?:/).test(resourceUrl)) {
      return true
    }

    // Process if the resourceUrl has a hostname in the allowedHostnames
    if (this.configuration['allowed-hostnames'].some((hostname) => domainMatch(hostname, resourceUrl))) {
      return true
    }

    // Capture if the resourceUrl is the same as the rootUrL
    if (resourceUrl.startsWith(rootUrl)) {
      return true
    }

    // We won't be capturing this asset, no need to wait for it to respond
    return false
  }

  private async resourcesForWidth(
    pool: pool.Pool<puppeteer.Page>,
    width: number,
    domSnapshot: string,
    rootResourceUrl: string,
    enableJavaScript: boolean,
    requestHeaders: any = {},
    logger: any,
  ): Promise<any[]> {
    logger.debug(addLogDate(`discovering assets for width: ${width}`))

    profile('--> assetDiscoveryService.pool.acquire', { url: rootResourceUrl })
    const page = await pool.acquire()
    profile('--> assetDiscoveryService.pool.acquire')

    page.on('request', async (request) => {
      const requestUrl = request.url()

      try {
        if (!this.shouldRequestResolve(request)) {
          await request.abort()
          return
        }

        if (requestUrl === rootResourceUrl) {
          await request.respond({
            body: domSnapshot,
            contentType: 'text/html',
            status: 200,
          })
          return
        }

        if (!this.shouldProcessRequest(requestUrl, rootResourceUrl)) {
          logger.debug(addLogDate(`Aborting ${requestUrl} -- will never be saved`))
          await request.abort()
          return
        }

        if (this.configuration['cache-responses'] === true && getResponseCache(requestUrl)) {
          logger.debug(addLogDate(`Asset cache hit for ${requestUrl}`))
          await request.respond(getResponseCache(requestUrl))

          return
        }

        logger.debug(addLogDate(`Starting processing for: ${requestUrl}`))

        await request.continue()
      } catch (error) {
        logError(error)
        await request.abort()
      }
    })

    const maybeResourcePromises: Promise<any>[] = []
    // Listen on 'requestfinished', which tells us a request completed successfully.
    // We could also listen on 'response', but then we'd have to check if it was successful.
    page.on('requestfinished', async (request) => {
      const response = request.response()

      if (response) {
        if (this.configuration['cache-responses'] === true) {
          await cacheResponse(response, logger)
        }
        // Parallelize the work in processResponse as much as possible, but make sure to
        // wait for it to complete before returning from the asset discovery phase.
        const promise = this.responseService.processResponse(
          rootResourceUrl,
          response,
          width,
          logger,
        )

        promise.catch(logError)
        maybeResourcePromises.push(promise)
      } else {
        logger.debug(addLogDate(`No response for ${request.url()}. Skipping.`))
      }
    })

    // Debug log failed requests.
    page.on('requestfailed', async (request) => {
      logger.debug(addLogDate(`Failed to load ${request.url()} : ${request.failure()!.errorText}}`))
    })

    let maybeResources: any[] = []

    try {
      await page.setJavaScriptEnabled(enableJavaScript)
      await page.setViewport(Object.assign(page.viewport(), { width }))
      await page.setExtraHTTPHeaders(merge.all([
        this.configuration['request-headers'],
        requestHeaders,
      ]) as {})

      profile('--> assetDiscoveryService.page.goto', { url: rootResourceUrl })
      await page.goto(rootResourceUrl)
      profile('--> assetDiscoveryService.page.goto')

      profile('--> assetDiscoveryService.waitForNetworkIdle')
      await waitForNetworkIdle(page, this.configuration['network-idle-timeout'])
      profile('--> assetDiscoveryService.waitForNetworkIdle')
    } catch (error) {
      logger.error(addLogDate(`${error.name} ${error.message}`))
      logger.debug(addLogDate(error))
    }

    try {
      profile('--> assetDiscoveryServer.waitForResourceProcessing')
      maybeResources = await Promise.all(maybeResourcePromises)
      profile('--> assetDiscoveryServer.waitForResourceProcessing')
    } catch (error) {
      logger.error(addLogDate(`${error.name} ${error.message}`))
      logger.debug(addLogDate(error))
    }

    // always release the page from the pool
    profile('--> assetDiscoveryService.pool.release', { url: rootResourceUrl })
    page.removeAllListeners('request')
    page.removeAllListeners('requestfinished')
    page.removeAllListeners('requestfailed')
    await pool.release(page)
    profile('--> assetDiscoveryService.pool.release')

    return maybeResources.filter(Boolean)
  }

  private async cleanPagePool() {
    if (this.pagePool === null) { return }
    await this.pagePool.drain()
    await this.pagePool.clear()
    this.pagePool = null
  }

  private async closeBrowser() {
    if (this.browser === null) { return }
    await this.browser.close()
    this.browser = null
  }
}
