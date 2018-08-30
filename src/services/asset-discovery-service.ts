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
    logger.profile('puppeteer.launch')
    this.browser = await puppeteer.launch({args: ['--no-sandbox']})
    logger.profile('puppeteer.launch')
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    if (!this.browser) {
      logger.error('Puppeteer has not been launched.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    logger.profile('puppeteer.newPage')
    let page = await this.browser.newPage()
    logger.profile('puppeteer.newPage')

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
        logger.profile('responseService.processResponse')
        const resource = await this.responseService.processResponse(response)
        logger.profile('responseService.processResponse')

        if (resource) { resources.push(resource) }
      } catch (error) { logError(error) }
    })

    let waitingPromise = page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: this.NAVIGATION_TIMEOUT,
    })
    logger.profile('puppeteer.page.goto')
    await page.goto(rootResourceUrl)
    logger.profile('puppeteer.page.goto')

    logger.profile('puppeteer.page.waitForNavigation')
    await waitingPromise.catch(logError)
    logger.profile('puppeteer.page.waitForNavigation')

    logger.profile('puppeteer.page.close')
    await page.close()
    logger.profile('puppeteer.page.close')

    logger.profile('unique.resources')
    resources = unique(resources)
    logger.profile('unique.resources')

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
