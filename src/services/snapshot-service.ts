import PercyClientService from './percy-client-service'
import AssetDiscoveryService from './asset-discovery-service'
import logger, {logError} from '../utils/logger'

export default class SnapshotService extends PercyClientService {
  buildId: number
  assetDiscoveryService: AssetDiscoveryService

  constructor(buildId: number) {
    super()

    this.buildId = buildId
    this.assetDiscoveryService = new AssetDiscoveryService()
  }

  async createSnapshot(
    name: string,
    rootResourceUrl: string,
    domSnapshot: string = '',
    enableJavaScript: boolean = false,
    widths: number[] = [1280],
    minimumHeight: number | null = null,
  ): Promise<any> {
    logger.debug(`creating snapshot '${name}'...`)

    let rootResource = this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let resources = [rootResource]

    let discoveredResources = await this.assetDiscoveryService.discoverResources(rootResourceUrl, domSnapshot)
    resources = resources.concat(discoveredResources)

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
