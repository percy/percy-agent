import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import * as fs from 'fs'
import * as crypto from 'crypto'
import ResourceService from './resource-service'
import * as puppeteer from 'puppeteer'

export default class ResponseService extends PercyClientService {
  static localCopiesPath = './tmp/'
  responsesProcessed: Map<string, string> = new Map()

  resourceService: ResourceService

  constructor() {
    super()
    this.resourceService = new ResourceService()
  }

  async processResponse(response: puppeteer.Response): Promise<any | null> {
    logger.info(`processing ${response.url()} response...`)

    let url = this.parseRequestPath(response.url())
    let localCopy = await this.makeLocalCopy(response)

    if (localCopy) {
      let resource = this.resourceService.createResourceFromFile(url, localCopy)
      logger.info(`HELLO: ${resource.resourceUrl}`)
      return resource
    }
  }

  async makeLocalCopy(response: puppeteer.Response): Promise<string | null> {
    let filename: string | null = null

    if (this.responsesProcessed.has(response.url())) {
      logger.info(`skipping request, local copy already present: '${response.url()}'`)
      return this.responsesProcessed.get(response.url()) || null
    } else {
      logger.info(`making local copy of response: ${response.url()}`)
    }

    const buffer = await response.buffer()
    let sha = crypto.createHash('sha256').update(buffer).digest('hex')
    filename = ResponseService.localCopiesPath + sha

    fs.writeFileSync(filename, buffer)

    this.responsesProcessed.set(response.url(), filename)

    return filename
  }
}
