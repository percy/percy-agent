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

  async discoverResources(rootResourceUrl: string, _domSnapshot: string): Promise<any[]> {
    logger.info(`discovering assets for URL: ${rootResourceUrl}`)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // Todo: load _domSnapshot into the page somehow

    let resources: any[] = []

    page.on('response', response => {
      logger.info(response.url())

      let resource = this.responseService.processResponse(response)

      if (resource) {
        resources.push(resource)
      }
    })

    // await page.goto(rootResourceUrl, {waitUntil: 'networkidle0'})
    await browser.close()

    return resources
  }
}
