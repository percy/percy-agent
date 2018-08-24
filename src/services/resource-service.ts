import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import * as path from 'path'

export default class ResourceService extends PercyClientService {
  async createResourceFromFile(responseURL: string, copyFilePath: string): Promise<any | null> {
    let copyFullPath = path.resolve(copyFilePath)
    let sha = path.basename(copyFilePath)
    let resourceUrl = responseURL

    logger.debug('creating resource')
    logger.debug(`-> response: ${responseURL}`)
    logger.debug(`-> copyFilePath: ${copyFilePath}`)
    logger.debug(`-> resourceUrl: ${resourceUrl}`)
    logger.debug(`-> localPath: ${copyFullPath}`)
    logger.debug(`-> sha: ${sha}`)

    return this.percyClient.makeResource({
      resourceUrl,
      localPath: copyFullPath,
      sha,
      // mimetype: response.headers['Content-Type']
    })
  }

  uploadMissingResources(snapshotResponse: any): Promise<any> {
    let uploadPromise: Promise<any> = this.percyClient.uploadMissingResources(
      snapshotResponse.buildId,
      snapshotResponse.response,
      snapshotResponse.resources
    )

    return uploadPromise
  }
}
