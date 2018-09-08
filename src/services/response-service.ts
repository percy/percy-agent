import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import * as fs from 'fs'
import * as crypto from 'crypto'
import ResourceService from './resource-service'
import * as puppeteer from 'puppeteer'
import {URL} from 'url'

const ALLOWED_RESPONSE_STATUSES = [200, 201]

export default class ResponseService extends PercyClientService {
  static localCopiesPath = './tmp/'
  responsesProcessed: Map<string, string> = new Map()
  resourceService: ResourceService

  constructor(buildId: number) {
    super()
    this.resourceService = new ResourceService(buildId)
  }

  async processResponse(response: puppeteer.Response): Promise<any | null> {
    const request = response.request()
    const parsedUrl = new URL(request.url())
    const localhost = `${parsedUrl.protocol}//${parsedUrl.host}`

    if (
      request.isNavigationRequest()
      || !ALLOWED_RESPONSE_STATUSES.includes(response.status())
      || !response.url().startsWith(localhost)
      ) {
      logger.debug(`Skipping: ${response.url()}`)
      return
    }

    logger.debug(`processing response: ${response.url()}`)
    const url = this.parseRequestPath(response.url())

    if (this.responsesProcessed.has(url)) {
      return this.responsesProcessed.get(url)
    }

    const localCopy = await this.makeLocalCopy(response)
    const resource = this.resourceService.createResourceFromFile(url, localCopy)
    this.responsesProcessed.set(url, resource)

    return resource
  }

  async makeLocalCopy(response: puppeteer.Response): Promise<string> {
    logger.debug(`making local copy of response: ${response.url()}`)

    const buffer = await response.buffer()
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = ResponseService.localCopiesPath + sha

    fs.writeFileSync(filename, buffer)

    return filename
  }
}
