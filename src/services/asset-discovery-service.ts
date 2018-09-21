import PercyClientService from './percy-client-service'
import ResponseService from './response-service'
import logger, {logError, profile} from '../utils/logger'
import * as puppeteer from 'puppeteer'
import unique from '../utils/unique-array'
import waitForNetworkIdle from '../utils/wait-for-network-idle'

export default class AssetDiscoveryService extends PercyClientService {
  readonly NETWORK_IDLE_TIMEOUT = 50 // ms

  responseService: ResponseService
  browser: puppeteer.Browser | null
  page: puppeteer.Page | null

  constructor(buildId: number) {
    super()
    this.responseService = new ResponseService(buildId)
    this.browser = null
    this.page = null
  }

  async setup() {
    profile('-> assetDiscoveryService.puppeteer.launch')
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false
    })
    profile('-> assetDiscoveryService.puppeteer.launch')

    profile('-> assetDiscoveryService.browser.newPage')
    this.page = await this.browser.newPage()
    await this.page.setRequestInterception(true)
    profile('-> assetDiscoveryService.browser.newPage')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    profile('-> assetDiscoveryService.discoverResources')

    if (!this.browser || !this.page) {
      logger.error('Puppeteer failed to open with a page.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    this.page.on('request', async request => {
      if (request.isNavigationRequest()) {
        await request.respond({
          status: 200,
          contentType: 'text/html',
          body: domSnapshot,
        })
      } else {
        await request.continue()
      }
    })

    this.page.on('response', async response => {
      try {
        const resource = await this.responseService.processResponse(rootResourceUrl, response)

        if (resource) { resources.push(resource) }
      } catch (error) { logError(error) }
    })

    profile('--> assetDiscoveryService.page.goto', {url: rootResourceUrl})
    await this.page.goto(rootResourceUrl)
    profile('--> assetDiscoveryService.page.goto')

    profile('--> assetDiscoveryService.waitForNetworkIdle')
    await waitForNetworkIdle(this.page, this.NETWORK_IDLE_TIMEOUT).catch(logError)
    profile('--> assetDiscoveryService.waitForNetworkIdle')

    this.page.removeAllListeners()

    resources = unique(resources)

    profile('-> assetDiscoveryService.discoverResources', {resourcesDiscovered: resources.length})

    return resources
  }

  async teardown() {
    await this.closePage()
    await this.closeBrowser()
  }

  private async closeBrowser() {
    if (!this.browser) { return }
    await this.browser.close()
    this.browser = null
  }

  private async closePage() {
    if (!this.page) { return }
    await this.page.close()
    this.page = null
  }
}
