import * as puppeteer from 'puppeteer'
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

  constructor(buildId: number, options: AssetDiscoveryOptions = {}) {
    super()
    this.responseService = new ResponseService(buildId)
    this.networkIdleTimeout = options.networkIdleTimeout || this.DEFAULT_NETWORK_IDLE_TIMEOUT
    this.browser = null
  }

  async setup() {
    profile('-> assetDiscoveryService.puppeteer.launch')
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false,
    })
    profile('-> assetDiscoveryService.puppeteer.launch')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    profile('-> assetDiscoveryService.discoverResources')

    if (!this.browser) {
      logger.error('Puppeteer failed to open with a page.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    profile('-> assetDiscoveryService.browser.newPage')
    const page = await this.browser.newPage()
    await page.setRequestInterception(true)
    profile('-> assetDiscoveryService.browser.newPage')

    let resources: any[] = []

    page.on('request', async (request) => {
      if (request.url() === rootResourceUrl) {
        await request.respond({
          body: domSnapshot,
          contentType: 'text/html',
          status: 200,
        })
      } else {
        await request.continue()
      }
    })

    page.on('response', async (response) => {
      try {
        const resource = await this.responseService.processResponse(rootResourceUrl, response)

        if (resource) { resources.push(resource) }
      } catch (error) { logError(error) }
    })

    profile('--> assetDiscoveryService.page.goto', {url: rootResourceUrl})
    await page.goto(rootResourceUrl)
    profile('--> assetDiscoveryService.page.goto')

    profile('--> assetDiscoveryService.waitForNetworkIdle')
    await waitForNetworkIdle(page, this.networkIdleTimeout).catch(logError)
    profile('--> assetDiscoveryService.waitForNetworkIdle')

    const resourceUrls: string[] = []

    // Dedup by resourceUrl as they must be unique when sent to Percy API down the line.
    resources = resources.filter((resource: any) => {
      if (!resourceUrls.includes(resource.resourceUrl)) {
        resourceUrls.push(resource.resourceUrl as string)
        return true
      }
      return false
    })

    await page.close()

    profile('-> assetDiscoveryService.discoverResources', {resourcesDiscovered: resources.length})

    return resources
  }

  async teardown() {
    await this.closeBrowser()
  }

  private async closeBrowser() {
    if (!this.browser) { return }
    await this.browser.close()
    this.browser = null
  }
}
