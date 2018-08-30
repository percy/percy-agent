import PercyClientService from './percy-client-service'
import ResponseService from './response-service'
import logger, {logError} from '../utils/logger'
import * as puppeteer from 'puppeteer'
import unique from '../utils/unique-array'
import {URL} from 'url'

export default class AssetDiscoveryService extends PercyClientService {
  responseService: ResponseService
  browser: puppeteer.Browser | null

  constructor() {
    super()
    this.responseService = new ResponseService()
    this.browser = null
  }

  async launchBrowser() {
    this.browser = await puppeteer.launch({args: ['--no-sandbox']})
  }

  async closeBrowser() {
    if (!this.browser) { return }

    await this.browser.close()
    this.browser = null
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    if (!this.browser) {
      logger.debug('Puppeteer browser has not been launched.')
      return []
    }

    logger.debug(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    const page = await this.browser.newPage()

    await page.setRequestInterception(true)

    page.on('request', async request => {
      if (request.isNavigationRequest()) {
        await request.respond({
          status: 200,
          contentType: 'text/html',
          body: domSnapshot,
        })
      } else {
        // Pass-through request.
        await request.continue()
      }
    })

    page.on('response', async response => {
      if (response.request().isNavigationRequest()) {
        return
      }

      const parsedUrl = new URL(rootResourceUrl)
      const localhost = `${parsedUrl.protocol}//${parsedUrl.host}`

      if (!response.url().startsWith(localhost)) {
        return
      }

      let resource = await this.responseService.processResponse(response)
      resources.push(resource)
    })

    let waitingPromise = page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000})
    await page.goto(rootResourceUrl)
    await waitingPromise.catch(logError)
    await page.close()

    return unique(resources)
  }
}
