import PercyClientService from './percy-client-service'
import AssetDiscoveryService from './asset-discovery-service'
import ResourceService from './resource-service'
import {profile} from '../utils/logger'

export default class SnapshotService extends PercyClientService {
  buildId: number
  assetDiscoveryService: AssetDiscoveryService
  resourceService: ResourceService

  constructor(buildId: number) {
    super()

    this.buildId = buildId
    this.assetDiscoveryService = new AssetDiscoveryService(buildId)
    this.resourceService = new ResourceService(buildId)
  }

  async rootResource(
    rootResourceUrl: string,
    domSnapshot: string = '',
  ): Promise<any[]> {
    const rootResource = this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    return rootResource
  }

  async discoveredResources(
    rootResourceUrl: string,
    domSnapshot: string = '',
  ): Promise<any[]> {
    const discoveredResources = await this.assetDiscoveryService.discoverResources(rootResourceUrl, domSnapshot)

    return discoveredResources
  }

  createSnapshot(
    name: string,
    resources: any[],
    enableJavaScript: boolean = false,
    widths: number[] = [1280],
    minimumHeight: number | null = null,
  ): Promise<any> {
    const snapshotCreationPromise: Promise<any> = this.percyClient.createSnapshot(
      this.buildId, resources, {name, widths, enableJavaScript, minimumHeight}
    ).then(async (response: any) => {
      profile('resourceService.uploadMissingResources')
      await this.resourceService.uploadMissingResources(response, resources)
      profile('resourceService.uploadMissingResources')
      return response
    })

    return snapshotCreationPromise
  }

  uploadResources(resources: any[]): Promise<any> {
    return this.resourceService.upload(resources)
  }

  // async finalizeSnapshot(snapshotId: number): Promise<boolean> {
  //   logger.debug('finalizing snapshot: ' + snapshotId)

  //   try {
  //     await this.percyClient.finalizeSnapshot(snapshotId)
  //     logger.info('finalized snapshot.')
  //     return true
  //   } catch (error) {
  //     logError(error)
  //     return false
  //   }
  // }
}
