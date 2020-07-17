import Axios from 'axios'
import * as crypto from 'crypto'
// @ts-ignore
import * as followRedirects from 'follow-redirects'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import { URL } from 'url'
import domainMatch from '../utils/domain-match'
import { addLogDate } from '../utils/logger'
import Constants from './constants'
import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'

const REDIRECT_STATUSES = [301, 302, 304, 307, 308]
const ALLOWED_RESPONSE_STATUSES = [200, 201, ...REDIRECT_STATUSES]

export default class ResponseService extends PercyClientService {
  resourceService: ResourceService
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
    logger.debug(addLogDate(`processing response: ${response.url()} for width: ${width}`))
    const url = this.parseRequestPath(response.url())

    // skip responses already processed
    const processResponse = this.responsesProcessed.get(url)
    if (processResponse) { return processResponse }

    const request = response.request()
    const parsedRootResourceUrl = new URL(rootResourceUrl)
    const isRedirect = REDIRECT_STATUSES.includes(response.status())
    const rootUrl = `${parsedRootResourceUrl.protocol}//${parsedRootResourceUrl.hostname}`

    if (request.url() === rootResourceUrl) {
      // Always skip the root resource
      logger.debug(addLogDate(`Skipping [is_root_resource]: ${request.url()}`))
      return
    }

    if (!ALLOWED_RESPONSE_STATUSES.includes(response.status())) {
      // Only allow 2XX responses:
      logger.debug(addLogDate(`Skipping [disallowed_response_status_${response.status()}] [${width} px]: ${response.url()}`))
      return
    }

    if (!this.shouldCaptureResource(rootUrl, request.url())) {
      // Disallow remote resource requests.
      logger.debug(addLogDate(`Skipping [is_remote_resource] [${width} px]: ${request.url()}`))
      return
    }

    if (isRedirect) {
      // We don't want to follow too deep of a chain
      // `followRedirects` is the npm package axios uses to follow redirected requests
      // we'll use their max redirect setting as a guard here
      if (request.redirectChain().length > followRedirects.maxRedirects) {
        logger.debug(addLogDate(`Skipping [redirect_too_deep: ${request.redirectChain().length}] [${width} px]: ${response.url()}`))
        return
      }

      const redirectedURL = `${rootUrl}${response.headers().location}` as string
      return this.handleRedirectResouce(url, redirectedURL, request.headers(), width, logger)
    }

    if (request.resourceType() === 'other' && (await response.text()).length === 0) {
      // Skip empty other resource types (browser resource hints)
      logger.debug(addLogDate(`Skipping [is_empty_other]: ${request.url()}`))
      return
    }

    return this.handlePuppeteerResource(url, response, width, logger)
  }

  /**
   * Handle processing and saving a resource that has a redirect chain. This
   * will download the resource from node, and save the content as the orignal
   * requesting url. This works since axios follows the redirect chain
   * automatically.
   */
  async handleRedirectResouce(
    originalURL: string,
    redirectedURL: string,
    requestHeaders: any,
    width: number,
    logger: any,
  ) {
    logger.debug(addLogDate(`Making local copy of redirected response: ${originalURL}`))

    try {
      const { data, headers } = await Axios(originalURL, {
        responseType: 'arraybuffer',
        headers: requestHeaders,
      }) as any

      const buffer = Buffer.from(data)
      const sha = crypto.createHash('sha256').update(buffer).digest('hex')
      const localCopy = path.join(os.tmpdir(), sha)
      const didWriteFile = this.maybeWriteFile(localCopy, buffer)
      const { fileIsTooLarge, responseBodySize } = this.checkFileSize(localCopy)

      if (!didWriteFile) {
        logger.debug(addLogDate(`Skipping file copy [already_copied]: ${originalURL}`))
      }

      if (fileIsTooLarge) {
        logger.debug(addLogDate(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${originalURL}`))
        return
      }

      const contentType = headers['content-type'] as string
      const resource = this.resourceService.createResourceFromFile(originalURL, localCopy, contentType, logger)

      this.responsesProcessed.set(originalURL, resource)
      this.responsesProcessed.set(redirectedURL, resource)

      return resource
    } catch (err) {
      logger.debug(`${err}`)
      logger.debug(addLogDate(`Failed to make a local copy of redirected response: ${originalURL}`))

      return
    }
  }

  /**
   * Handle processing and saving a resource coming from Puppeteer. This will
   * take the response object from Puppeteer and save the asset locally.
   */
  async handlePuppeteerResource(url: string, response: puppeteer.Response, width: number, logger: any) {
    logger.debug(addLogDate(`Making local copy of response: ${response.url()}`))

    const buffer = await response.buffer()
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const localCopy = path.join(os.tmpdir(), sha)
    const didWriteFile = this.maybeWriteFile(localCopy, buffer)

    if (!didWriteFile) {
      logger.debug(addLogDate(`Skipping file copy [already_copied]: ${response.url()}`))
    }

    const contentType = response.headers()['content-type']
    const { fileIsTooLarge, responseBodySize } = this.checkFileSize(localCopy)

    if (fileIsTooLarge) {
      logger.debug(addLogDate(`Skipping [max_file_size_exceeded_${responseBodySize}] [${width} px]: ${response.url()}`))
      return
    }

    const resource = this.resourceService.createResourceFromFile(url, localCopy, contentType, logger)
    this.responsesProcessed.set(url, resource)

    return resource
  }

  /**
   * Write a local copy of the SHA only if it doesn't exist on the file system
   * already.
   */
  maybeWriteFile(filePath: string, buffer: any): boolean {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer)
      return true
    } else {
      return false
    }
  }

  /**
   * Ensures the saved file is not larger than what the Percy API accepts. It
   * returns if the file is too large, as well as the files size.
   */
  checkFileSize(filePath: string) {
    const responseBodySize = fs.statSync(filePath).size
    const fileIsTooLarge = responseBodySize > Constants.MAX_FILE_SIZE_BYTES

    return { fileIsTooLarge, responseBodySize }
  }
}
