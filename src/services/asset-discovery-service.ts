import PercyClientService from './percy-client-service'
import ResponseService from './response-service'
import logger, {logError} from '../utils/logger'
import * as puppeteer from 'puppeteer'
import unique from '../utils/unique-array'

export default class AssetDiscoveryService extends PercyClientService {
  readonly NAVIGATION_TIMEOUT = 3000 // ms

  responseService: ResponseService
  browser: puppeteer.Browser | null

  constructor() {
    super()
    this.responseService = new ResponseService()
    this.browser = null
  }

  async setup() {
    this.browser = await puppeteer.launch({args: ['--no-sandbox']})
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    if (!this.browser) {
      logger.error('Puppeteer has not been launched.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    let page = await this.browser.newPage()
    await page.setRequestInterception(true)

    page.on('request', async request => {
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

    page.on('response', async response => {
      try {
        const resource = await this.responseService.processResponse(response)
        if (resource) { resources.push(resource) }
      } catch (error) { logError(error) }
    })

    let waitingPromise = page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: this.NAVIGATION_TIMEOUT,
    })

    await page.goto(rootResourceUrl)
    await waitingPromise.catch(logError)
    await page.close()

    return unique(resources)
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
