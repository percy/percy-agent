import {logError, profile} from '../utils/logger'
import AssetDiscoveryService from './asset-discovery-service'
import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'

interface SnapshotServiceOptions {
  networkIdleTimeout?: number
}

export default class SnapshotService extends PercyClientService {
  assetDiscoveryService: AssetDiscoveryService
  resourceService: ResourceService

  buildId: number

  constructor(buildId: number, options: SnapshotServiceOptions = {}) {
    super()

    this.buildId = buildId
    this.assetDiscoveryService = new AssetDiscoveryService(
      buildId,
      {networkIdleTimeout: options.networkIdleTimeout},
    )

    this.resourceService = new ResourceService(buildId)
  }

  async buildResources(
    rootResourceUrl: string,
    domSnapshot = '',
  ): Promise<any[]> {
    const rootResource = await this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let resources: any[] = []
    const discoveredResources = await this.assetDiscoveryService.discoverResources(rootResourceUrl, domSnapshot)
    resources = resources.concat([rootResource])
    resources = resources.concat(discoveredResources)

    return resources
  }

  create(
    name: string,
    resources: any[],
    enableJavaScript = false,
    widths: number[] | null = null,
    minHeight: number | null = null,
    clientInfo: string | null= null,
    environmentInfo: string | null= null,
  ): Promise<any> {
    const snapshotCreationPromise: Promise<any> = this.percyClient.createSnapshot(
      this.buildId, resources, {name, widths, enableJavaScript, minimumHeight: minHeight, clientInfo, environmentInfo},
    ).then(async (response: any) => {
      await this.resourceService.uploadMissingResources(response, resources)
      return response
    }).then(async (response: any) => {
      const snapshotId = response.body.data.id

      profile('-> snapshotService.finalizeSnapshot')
      await this.finalize(response.body.data.id)
      profile('-> snapshotService.finalizeSnapshot', {snapshotId})
      return response
    }).catch(logError)

    return snapshotCreationPromise
  }

  async finalize(snapshotId: number): Promise<boolean> {
    try {
      await this.percyClient.finalizeSnapshot(snapshotId)
      return true
    } catch (error) {
      logError(error)
      return false
    }
  }
}
