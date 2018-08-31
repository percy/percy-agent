import PercyClientService from './percy-client-service'
import ResponseService from './response-service'
import logger, {logError} from '../utils/logger'
import * as puppeteer from 'puppeteer'
import unique from '../utils/unique-array'
import waitForNetworkIdle from '../utils/wait-for-network-idle'

export default class AssetDiscoveryService extends PercyClientService {
  readonly NETWORK_IDLE_TIMEOUT = 25 // ms

  responseService: ResponseService
  browser: puppeteer.Browser | null
  page: puppeteer.Page | null

  constructor() {
    super()
    this.responseService = new ResponseService()
    this.browser = null
    this.page = null
  }

  async setup() {
    logger.profile('puppeteer.launch')
    this.browser = await puppeteer.launch({args: ['--no-sandbox']})
    logger.profile('puppeteer.launch')

    logger.profile('browser.newPage')
    this.page = await this.browser.newPage()
    logger.profile('browser.newPage')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    if (!this.browser || !this.page) {
      logger.error('Puppeteer failed to open with a page.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    await this.page.setRequestInterception(true)

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
        const resource = await this.responseService.processResponse(response)

        if (resource) { resources.push(resource) }
      } catch (error) { logError(error) }
    })

    logger.profile('page.goto')
    await this.page.goto(rootResourceUrl)
    logger.profile('page.goto')

    logger.profile('waitForNetworkIdle')
    await waitForNetworkIdle(this.page, this.NETWORK_IDLE_TIMEOUT).catch(logError)
    logger.profile('waitForNetworkIdle')

    this.page.removeAllListeners()

    resources = unique(resources)

    return resources
  }

  async teardown() {
    await this.closeBrowser()
    await this.closePage()
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
