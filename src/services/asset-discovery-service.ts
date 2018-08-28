import PercyClientService from './percy-client-service'
import ResponseService from './response-service'
import logger from '../utils/logger'
import * as puppeteer from 'puppeteer'

export default class AssetDiscoveryService extends PercyClientService {
  responseService: ResponseService

  constructor() {
    super()
    this.responseService = new ResponseService()
  }

  async discoverResources(rootResourceUrl: string, domSnapshot: string): Promise<any[]> {
    logger.info(`discovering assets for URL: ${rootResourceUrl}`)

    let resources: any[] = []

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setRequestInterception(true)

    page.on('request', request => {
      if (request.isNavigationRequest()) {
        request.respond({
          status: 200,
          contentType: 'text/html',
          body: domSnapshot,
        })
      } else {
        // Pass-through request.
        request.continue()
      }
    })

    page.on('response', async response => {
      if (response.request().isNavigationRequest()) {
        return
      }

      let resource = await this.responseService.processResponse(response)
      if (resource) { resources.push(resource) }
    })

    let waitingPromise = page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000})
    await page.goto(rootResourceUrl)
    await waitingPromise
    await page.close()
    await browser.close()

    return resources
  }
}
