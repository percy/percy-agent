import PercyClientService from './percy-client-service'
import Axios from 'axios'
import logger from '../utils/logger'
import unique from '../utils/unique-array'
import * as fs from 'fs'
import * as crypto from 'crypto'
import ResourceService from './resource-service'

export default class RequestService extends PercyClientService {
  static localCopiesPath = './tmp/'

  async processManifest(requestManifest: string[]): Promise<any[]> {
    logger.info(`processing ${requestManifest.length} requests...`)

    let filteredRequestManifests = this.filterRequestManifest(requestManifest)
    logger.info(`filtered to ${filteredRequestManifests.length} requests...`)

    let localCopies = await this.createLocalCopies(filteredRequestManifests)

    let resourceService = new ResourceService()
    let resources = await resourceService.createResourcesFromLocalCopies(localCopies)

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
}
