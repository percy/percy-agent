import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import {URL} from 'url'
import logger from '../utils/logger'
import Constants from './constants'
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

  async processResponse(rootResourceUrl: string, response: puppeteer.Response, width: number): Promise<any | null> {
    logger.debug(`processing response: ${response.url()} for width: ${width}`)
    const url = this.parseRequestPath(response.url())

    // skip responses already processed
    const processResponse = this.responsesProcessed.get(url)
    if (processResponse) { return processResponse }

    const request = response.request()
    const parsedRootResourceUrl = new URL(rootResourceUrl)
    const rootUrl = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.host}`

    if (request.url() === rootResourceUrl) {
      // Always skip the root resource
      logger.debug(`Skipping [is_root_resource]: ${request.url()}`)
      return
    }

    if (!this.ALLOWED_RESPONSE_STATUSES.includes(response.status())) {
      // Only allow 2XX responses:
      logger.debug(`Skipping [disallowed_response_status_${response.status()}] [${width} px]: ${response.url()}`)
      return
    }

    if (!request.url().startsWith(rootUrl)) {
      // Disallow remote resource requests.
      logger.debug(`Skipping [is_remote_resource] [${width} px]: ${request.url()}`)
      return
    }

    if (!response.url().startsWith(rootUrl)) {
      // Disallow remote redirects.
      logger.debug(`Skipping [is_remote_redirect] [${width} px]: ${response.url()}`)
      return
    }

    const localCopy = await this.makeLocalCopy(response)

    const responseBodySize = fs.statSync(localCopy).size
    if (responseBodySize > Constants.MAX_FILE_SIZE_BYTES) {
      // Skip large resources
      logger.debug(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${response.url()}`)
      return
    }

    const contentType = response.headers()['content-type']
    const resource = this.resourceService.createResourceFromFile(url, localCopy, contentType)
    this.responsesProcessed.set(url, resource)

    return resource
  }

  async makeLocalCopy(response: puppeteer.Response): Promise<string> {
    logger.debug(`Making local copy of response: ${response.url()}`)

    const buffer = await response.buffer()
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = path.join(this.tmpDir(), sha)

    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, buffer)
    } else {
      logger.debug(`Skipping file copy [already_copied]: ${response.url()}`)
    }

    return filename
  }

  tmpDir(): string {
    return os.tmpdir()
  }
}
