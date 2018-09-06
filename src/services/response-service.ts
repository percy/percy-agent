import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import * as fs from 'fs'
import * as crypto from 'crypto'
import ResourceService from './resource-service'
import * as puppeteer from 'puppeteer'
import {URL} from 'url'

export default class ResponseService extends PercyClientService {
  static localCopiesPath = './tmp/'
  responsesProcessed: Map<string, string> = new Map()
  resourceService: ResourceService

  constructor(buildId: number) {
    super()
    this.resourceService = new ResourceService(buildId)
  }

  async processResponse(response: puppeteer.Response): Promise<any | null> {
    logger.debug(`processing ${response.url()} response...`)
    const request = response.request()

    if (request.isNavigationRequest()) { return }

    const parsedUrl = new URL(request.url())
    const localhost = `${parsedUrl.protocol}//${parsedUrl.host}`

    if (!response.url().startsWith(localhost)) { return }

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
