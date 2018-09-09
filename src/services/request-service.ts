import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'
import Axios from 'axios'
import logger from '../utils/logger'
import unique from '../utils/unique-array'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as crypto from 'crypto'

export default class RequestService extends PercyClientService {
  resourceService: ResourceService
  requestsProcessed: Map<string, string> = new Map()

  constructor() {
    super()
    this.resourceService = new ResourceService()
  }

  async processRequests(requests: string[]): Promise<any[]> {
    logger.info(`processing ${requests.length} requests...`)

    const filteredRequests = this.filterRequests(requests)
    logger.info(`filtered to ${filteredRequests.length} requests...`)

    const localCopies = await this.createLocalCopies(filteredRequests)
    const resources = await this.resourceService.createResourcesFromLocalCopies(localCopies)

    return resources
  }

  tmpDir(): string {
    return os.tmpdir()
  }

  private async createLocalCopies(requests: string[]): Promise<Map<string, string>> {
    let localCopies: Map<string, string> = new Map()
    let requestPromises = []

    for (const request of requests) {
      let requestPromise = new Promise(async (resolve, _reject) => {
        const localCopy = await this.makeLocalCopy(request)
        localCopies.set(request, localCopy)
        resolve()
      })

      requestPromises.push(requestPromise)
    }

    await Promise.all(requestPromises)

    return localCopies
  }

  private async makeLocalCopy(request: string): Promise<string> {
    let processedRequest = this.requestsProcessed.get(request)

    if (processedRequest) {
      logger.info(`skipping request, local copy already present: '${request}'`)
      return processedRequest
    }

    logger.info(`making local copy of request: ${request}`)

    let localFilename = await Axios({
      method: 'get',
      url: request,
      responseType: 'arraybuffer',
    } as any).then(response => {
      if (!response.data) {
        logger.info(`skipping '${request}' - empty response body`)
      }

      const tmpFile = this.tmpFileFromData(response.data)
      this.requestsProcessed.set(request, tmpFile)

      return tmpFile
    })

    return localFilename
  }

  private filterRequests(requests: string[]): string[] {
    requests = requests.map(request => {
      return this.parseRequestPath(request)
    })

    return unique(requests)
  }

  private tmpFileFromData(data: any): string {
    const sha = crypto.createHash('sha256').update(data, 'utf8').digest('hex')
    const tmpFile = path.join(this.tmpDir(), sha)

    fs.writeFileSync(tmpFile, data)
    return tmpFile
  }
}
