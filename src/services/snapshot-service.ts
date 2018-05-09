import PercyClientService from './percy-client-service'
import RequestService from './request-service'
import logger, {logError} from '../utils/logger'

export default class SnapshotService extends PercyClientService {
  buildId: number

  constructor(buildId: number) {
    super()

    this.buildId = buildId
  }

  async createSnapshot(
    name: string,
    rootResourceUrl: string,
    domSnapshot: string = '',
    requestManifest: string[] = [],
    enableJavaScript: boolean = false,
    widths: number[] = [1280],
    minimumHeight: number = 500,
  ): Promise<number | null> {
    logger.info(`creating snapshot '${name}'...`)

    let rootResource = this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let resources = [rootResource]

    if (requestManifest) {
      let requestService = new RequestService()
      let requestResources = await requestService.processManifest(requestManifest)
      resources = resources.concat(requestResources)
    }

    let snapshotId: number | null = null

    await this.percyClient.createSnapshot(
      this.buildId, resources, {name, widths, enableJavaScript, minimumHeight}
    ).then(async (response: any) => {
      logger.info(`uploading missing ${resources.length} resources...`)

      snapshotId = parseInt(response.body.data.id)

      await this.percyClient.uploadMissingResources(this.buildId, response, resources)
        .then(async () => {
          logger.info('missing resources uploaded.')

          if (snapshotId) {
            await this.finalizeSnapshot(snapshotId)
          } else {
            // error state. snapshotid was missing.
          }
        }).catch(logError)
    }).catch(logError)

    return snapshotId
  }

  async finalizeSnapshot(snapshotId: number): Promise<boolean> {
    logger.debug('finalizing snapshot: ' + snapshotId)

    let response = await this.percyClient.finalizeSnapshot(snapshotId)
      .then(() => {
        logger.info('finalized snapshot.')
        return true
      }, (error: any) => {
        logError(error)
        return false
      })

    return response
  }
}
