import PercyClientService from './percy-client-service'
import AssetDiscoveryService from './asset-discovery-service'
import ResourceService from './resource-service'
import {logError, profile} from '../utils/logger'

interface SnapshotServiceOptions {
  networkIdleTimeout?: number
}

export default class SnapshotService extends PercyClientService {
  assetDiscoveryService: AssetDiscoveryService
  resourceService: ResourceService

  buildId: number
  readonly defaultWidths = [1280]

  constructor(buildId: number, options: SnapshotServiceOptions = {}) {
    super()

    this.buildId = buildId
    this.assetDiscoveryService = new AssetDiscoveryService(
      buildId,
      {networkIdleTimeout: options.networkIdleTimeout}
    )

    this.resourceService = new ResourceService(buildId)
  }

  async buildResources(
    rootResourceUrl: string,
    domSnapshot = '',
  ): Promise<any[]> {
    let rootResource = await this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let resources: any[] = []
    let discoveredResources = await this.assetDiscoveryService.discoverResources(rootResourceUrl, domSnapshot)
    resources = resources.concat([rootResource])
    resources = resources.concat(discoveredResources)

    return resources
  }

  create(
    name: string,
    resources: any[],
    enableJavaScript = false,
    widths: number[] = this.defaultWidths,
    minimumHeight: number | null = null,
  ): Promise<any> {
    const snapshotCreationPromise: Promise<any> = this.percyClient.createSnapshot(
      this.buildId, resources, {name, widths, enableJavaScript, minimumHeight}
    ).then(async (response: any) => {
      await this.resourceService.uploadMissingResources(response, resources)
      return response
    }).then(async (response: any) => {
      const snapshotId = response.body.data.id

      profile('-> snapshotService.finalizeSnapshot')
      await this.finalize(response.body.data.id)
      profile('-> snapshotService.finalizeSnapshot', {snapshotId})
      return response
    })

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
