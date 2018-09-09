import PercyClientService from './percy-client-service'
import RequestService from './request-service'
import logger, {logError} from '../utils/logger'

export default class SnapshotService extends PercyClientService {
  buildId: number
  requestService: RequestService
  defaultWidths = [1280]

  constructor(buildId: number) {
    super()

    this.buildId = buildId
    this.requestService = new RequestService()
  }

  async createSnapshot(
    name: string,
    rootResourceUrl: string,
    domSnapshot = '',
    requests: string[] = [],
    enableJavaScript = false,
    widths: number[] = this.defaultWidths,
    minimumHeight: number | null = null,
  ): Promise<any> {
    logger.info(`creating snapshot '${name}'...`)

    let rootResource = this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let resources = [rootResource]

    logger.debug('processing request...')
    let requestResources = await this.requestService.processRequests(requests)
    logger.debug('request processed.')

    resources = resources.concat(requestResources)

    let response = await this.percyClient.createSnapshot(
      this.buildId, resources, {name, widths, enableJavaScript, minimumHeight}
    ).then((response: any) => {
      return response
    }).catch(logError)

    let snapshotResponse = {
      buildId: this.buildId,
      response,
      resources
    }

    return snapshotResponse
  }

  async finalizeSnapshot(snapshotId: number): Promise<boolean> {
    logger.debug('finalizing snapshot: ' + snapshotId)

    try {
      await this.percyClient.finalizeSnapshot(snapshotId)
      logger.info('finalized snapshot.')
      return true
    } catch (error) {
      logError(error)
      return false
    }
  }
}
