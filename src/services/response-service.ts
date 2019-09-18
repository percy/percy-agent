import Axios from 'axios'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import { URL } from 'url'
import domainMatch from '../utils/domain-match'
import Constants from './constants'
import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'

export default class ResponseService extends PercyClientService {
  resourceService: ResourceService

  readonly REDIRECT_STATUSES = [301, 302, 304, 307, 308]
  readonly ALLOWED_RESPONSE_STATUSES = [200, 201, 301, 302, 304, 307, 308]
  responsesProcessed: Map<string, string> = new Map()
  allowedHostnames: string[]

  constructor(buildId: number, allowedHostnames: string[]) {
    super()
    this.resourceService = new ResourceService(buildId)
    this.allowedHostnames = allowedHostnames
  }

  shouldCaptureResource(rootUrl: string, resourceUrl: string): boolean {
    // Capture if the resourceUrl is the same as the rootUrL
    if (resourceUrl.startsWith(rootUrl)) {
      return true
    }

    // Capture if the resourceUrl has a hostname in the allowedHostnames
    if (this.allowedHostnames.some((hostname) => domainMatch(hostname, resourceUrl))) {
      return true
    }

    // Resource is not allowed
    return false
  }

  async processResponse(
    rootResourceUrl: string,
    response: puppeteer.Response,
    width: number,
    logger: any,
  ): Promise<any | null> {
    logger.debug(`processing response: ${response.url()} for width: ${width}`)
    const url = this.parseRequestPath(response.url())

    // skip responses already processed
    const processResponse = this.responsesProcessed.get(url)
    if (processResponse) { return processResponse }

    const request = response.request()
    const parsedRootResourceUrl = new URL(rootResourceUrl)
    const isRedirect = this.REDIRECT_STATUSES.includes(response.status())
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

    if (!this.shouldCaptureResource(rootUrl, request.url())) {
      // Disallow remote resource requests.
      logger.debug(`Skipping [is_remote_resource] [${width} px]: ${request.url()}`)
      return
    }

    if (isRedirect) {
      // We don't want to follow too deep of a chain
      if (request.redirectChain().length > 4) {
        logger.debug(`Skipping [redirect_too_deep: ${request.redirectChain().length}] [${width} px]: ${response.url()}`)
        return
      }

      return this.handleRedirect(url, width, response, logger)
    }

    const localCopy = await this.makeLocalCopy(response, logger)
    const responseBodySize = fs.statSync(localCopy).size

    if (responseBodySize > Constants.MAX_FILE_SIZE_BYTES) {
      // Skip large resources
      logger.debug(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${response.url()}`)
      return
    }

    const contentType = response.headers()['content-type']
    const resource = this.resourceService.createResourceFromFile(url, localCopy, contentType, logger)
    this.responsesProcessed.set(url, resource)

    return resource
  }

  async handleRedirect(redirectedURL: string, width: number, response: puppeteer.Response, logger: any) {
    logger.debug(`Making local copy of redirected response: ${redirectedURL}`)

    const { data } = await Axios(redirectedURL, { responseType: 'text' }) as any
    const buffer = Buffer.from(data, 'utf8')
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const localCopy = path.join(this.tmpDir(), sha)

    if (!fs.existsSync(localCopy)) {
      fs.writeFileSync(localCopy, buffer)
    } else {
      logger.debug(`Skipping file copy [already_copied]: ${redirectedURL}`)
    }

    const responseBodySize = fs.statSync(localCopy).size
    if (responseBodySize > Constants.MAX_FILE_SIZE_BYTES) {
      // Skip large resources
      logger.debug(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${response.url()}`)
      return
    }

    // By not setting it to text, it serves it correctly it seems?
    const contentType = ''
    const resource = this.resourceService.createResourceFromFile(redirectedURL, localCopy, contentType, logger)
    this.responsesProcessed.set(redirectedURL, resource)

    return resource
  }

  async makeLocalCopy(response: puppeteer.Response, logger: any): Promise<string> {
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
