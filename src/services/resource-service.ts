import PercyClientService from './percy-client-service'
import logger, {logError} from '../utils/logger'
import * as path from 'path'

export default class ResourceService extends PercyClientService {
  resourcesUploaded: any[] = []
  buildId: number

  constructor(buildId: number) {
    super()
    this.buildId = buildId
  }

  createResourceFromFile(responseUrl: string, copyFilePath: string): any {
    let copyFullPath = path.resolve(copyFilePath)
    let sha = path.basename(copyFilePath)
    let resourceUrl = responseUrl

    logger.debug('creating resource')
    logger.debug(`-> response: ${responseUrl}`)
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

  async uploadMissingResources(response: any, resources: any[]): Promise<boolean> {
    let snapshotResponse = {
      buildId: this.buildId,
      response,
      resources
    }

    try {
      await this.percyClient.uploadMissingResources(
        snapshotResponse.buildId,
        snapshotResponse.response,
        snapshotResponse.resources
      )
      // logger('missing resources uploaded')

      return true
    } catch (error) {
      logError(error)
      return false
    }
  }

  async upload(resources: any[]) {
    logger.debug(`Uploading ${resources.length} resources`)
    resources = resources.filter(resource => !this.resourcesUploaded.includes(resource))
    logger.debug(`-> filtered to ${resources.length} resources`)

    if (resources.length === 0) { return }

    this.resourcesUploaded = this.resourcesUploaded.concat(resources)

    await this.percyClient.uploadResources(this.buildId, resources).catch(logError)
  }
}
