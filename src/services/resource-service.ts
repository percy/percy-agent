import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import * as path from 'path'

export default class ResourceService extends PercyClientService {
  async createResourcesFromLocalCopies(localCopies: Map<string, string>): Promise<any[]> {
    let resources: any[] = []
    let resourceService = new ResourceService()

    localCopies.forEach(async (localFileName: string, requestUrl: string) => {
      let resource = await resourceService.createResourceFromFile(requestUrl, localFileName)
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
