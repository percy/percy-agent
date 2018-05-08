import PercyClientService from './percy-client-service'
import Axios from 'axios'
import logger from '../utils/logger'
import unique from '../utils/unique-array'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

export default class RequestService extends PercyClientService {
  static localCopiesPath = './tmp/'

  async processManifest(requestManifest: string[]): Promise<any[]> {
    logger.info(`processing ${requestManifest.length} requests...`)

    let filteredRequestManifests = this.filterRequestManifest(requestManifest)
    logger.info(`filtered to ${filteredRequestManifests.length} requests...`)

    let localCopies = await this.createLocalCopies(filteredRequestManifests)
    let resources = await this.createResourcesFromLocalCopies(localCopies)

    return resources
  }

  filterRequestManifest(requestManifest: string[]): string[] {
    requestManifest = unique(requestManifest)

    return requestManifest.filter(request => {
      return !request.match(/http:\/\/localhost:\d+\/percy/)
    })
  }

  async createLocalCopies(requestManifest: string[]): Promise<Map<string, string>> {
    let localCopies: Map<string, string> = new Map()

    for (let request of requestManifest) {
      logger.debug(`making local copy of request: ${request}`)

      let localCopy = await this.makeLocalCopy(request)
      if (localCopy) {
        localCopies.set(request, localCopy)
      }
    }

    return localCopies
  }

  async makeLocalCopy(request: string): Promise<string | null> {
    let filename: string | null = null

    await Axios({
      method: 'get',
      url: request,
      responseType: 'blob'
    }).then(response => {
      if (response.data) {
        let sha = crypto.createHash('sha256').update(response.data, 'utf8').digest('hex')
        filename = RequestService.localCopiesPath + sha
        fs.writeFileSync(filename, response.data)
      } else {
        logger.warn(`skipping '${request}' - empty response body`)
      }
    }).catch(error => {
      logger.warn(`fetching '${request}' - ${error.message}`)
      logger.debug(error)
    })

    return filename
  }

  // TODO: possibly move this into resource-service.ts
  async createResourcesFromLocalCopies(localCopies: Map<string, string>): Promise<any[]> {
    let resources: any[] = []

    localCopies.forEach(async (localFileName: string, requestUrl: string) => {
      let resource = await this.createResourceFromFile(requestUrl, localFileName)
      if (resource !== undefined && resource !== null) {
        resources.push(resource)
      }
    })

    return resources
  }

  async createResourceFromFile(request: string, copyFilePath: string): Promise<any | null> {
    let copyFullPath = path.resolve(copyFilePath)
    let sha = path.basename(copyFilePath)

    logger.debug('creating resource')
    logger.debug(`-> request: ${request}`)
    logger.debug(`-> copyFilePath: ${copyFilePath}`)
    logger.debug(`-> resourceUrl: ${this.parseUrlPath(request)}`)
    logger.debug(`-> localPath: ${copyFullPath}`)
    logger.debug(`-> sha: ${sha}`)

    return this.percyClient.makeResource({
      resourceUrl: this.parseUrlPath(request),
      localPath: copyFullPath,
      sha,
      // mimetype: response.headers['Content-Type']
    })
  }
}
