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

    let url = response.url() // this.parseRequestPath(request)
    let localCopy = await this.makeLocalCopy(response)

    if (localCopy) {
      let resource = await this.resourceService.createResourceFromFile(url, localCopy)
      return resource
    }
  }

  async makeLocalCopy(response: any): Promise<string | null> {
    let filename: string | null = null

    if (this.responsesProcessed.has(response)) {
      logger.info(`skipping request, local copy already present: '${response}'`)
      return this.responsesProcessed.get(response) || null
    } else {
      logger.info(`making local copy of response: ${response}`)
    }

    if (response.data) {
      let sha = crypto.createHash('sha256').update(response.data, 'utf8').digest('hex')
      filename = ResponseService.localCopiesPath + sha
      fs.writeFileSync(filename, response.data)

      this.responsesProcessed.set(response, filename)
    }

    return filename
  }
}
