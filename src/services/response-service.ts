import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import {URL} from 'url'
import logger from '../utils/logger'
import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'

export default class ResponseService extends PercyClientService {
  resourceService: ResourceService

  readonly ALLOWED_RESPONSE_STATUSES = [200, 201, 304]
  responsesProcessed: Map<string, string> = new Map()

  constructor(buildId: number) {
    super()
    this.resourceService = new ResourceService(buildId)
  }

  async processResponse(rootResourceUrl: string, response: puppeteer.Response): Promise<any | null> {
    logger.debug(`processing response: ${response.url()}`)
    const url = this.parseRequestPath(response.url())

    // skip responses already processed
    const processResponse = this.responsesProcessed.get(url)
    if (processResponse) { return processResponse }

    const request = response.request()
    const parsedRootResourceUrl = new URL(rootResourceUrl)
    const rootUrl = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.host}`

    if (request.url() === rootResourceUrl) {
      // Always skip the root resource
      logger.debug(`Skipping [is_root_resource]: ${response.url()}`)
      return
    }

    if (!this.ALLOWED_RESPONSE_STATUSES.includes(response.status())) {
      // Only allow 2XX responses:
      logger.debug(`Skipping [disallowed_response_status]: ${response.url()}`)
      return
    }

    if (!request.url().startsWith(rootUrl)) {
      // Disallow remote resource requests.
      logger.debug(`Skipping [is_remote_resource]: ${response.url()}`)
      return
    }

    if (!response.url().startsWith(rootUrl)) {
      // Disallow remote redirects.
      logger.debug(`Skipping [is_remote_redirect]: ${response.url()}`)
      return
    }

    const localCopy = await this.makeLocalCopy(response)
    const contentType = response.headers()['content-type']

    const resource = this.resourceService.createResourceFromFile(url, localCopy, contentType)
    this.responsesProcessed.set(url, resource)

    return resource
  }

  async makeLocalCopy(response: puppeteer.Response): Promise<string> {
    logger.debug(`making local copy of response: ${response.url()}`)

    const buffer = await response.buffer()
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = path.join(this.tmpDir(), sha)

    fs.writeFileSync(filename, buffer)

    return filename
  }

  tmpDir(): string {
    return os.tmpdir()
  }
}
