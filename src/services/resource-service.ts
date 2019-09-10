import * as path from 'path'
import { logError, profile } from '../utils/logger'
import PercyClientService from './percy-client-service'

export default class ResourceService extends PercyClientService {
  resourcesUploaded: any[] = []
  buildId: number

  constructor(buildId: number) {
    super()
    this.buildId = buildId
  }

  createResourceFromFile(responseUrl: string, copyFilePath: string, contentType = '', logger: any): any {
    const copyFullPath = path.resolve(copyFilePath)
    const sha = path.basename(copyFilePath)
    const resourceUrl = responseUrl

    logger.debug('creating resource')
    logger.debug(`-> response: ${responseUrl}`)
    logger.debug(`-> copyFilePath: ${copyFilePath}`)
    logger.debug(`-> resourceUrl: ${resourceUrl}`)
    logger.debug(`-> localPath: ${copyFullPath}`)
    logger.debug(`-> sha: ${sha}`)
    logger.debug(`-> contentType: ${contentType}`)

    return this.percyClient.makeResource({
      resourceUrl,
      localPath: copyFullPath,
      sha,
      mimetype: contentType,
    })
  }

  async uploadMissingResources(response: any, resources: any[]): Promise<boolean> {
    profile('-> resourceService.uploadMissingResources')

    const snapshotResponse = {
      buildId: this.buildId,
      response,
      resources,
    }

    try {
      await this.percyClient.uploadMissingResources(
        snapshotResponse.buildId,
        snapshotResponse.response,
        snapshotResponse.resources,
      )
      profile('-> resourceService.uploadMissingResources', {resources: resources.length})

      return true
    } catch (error) {
      logError(error)
      return false
    }
  }
}
