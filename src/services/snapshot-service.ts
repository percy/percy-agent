import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { AssetDiscoveryConfiguration } from '../configuration/asset-discovery-configuration'
import { SnapshotOptions } from '../percy-agent-client/snapshot-options'
import { logError, profile } from '../utils/logger'
import { AssetDiscoveryService } from './asset-discovery-service'
import PercyClientService from './percy-client-service'
import ResourceService from './resource-service'

export default class SnapshotService extends PercyClientService {
  assetDiscoveryService: AssetDiscoveryService
  resourceService: ResourceService

  buildId: number

  constructor(buildId: number, configuration?: AssetDiscoveryConfiguration) {
    super()

    this.buildId = buildId
    this.resourceService = new ResourceService(buildId)
    this.assetDiscoveryService = new AssetDiscoveryService(buildId, configuration)
  }

  async buildResources(
    rootResourceUrl: string,
    domSnapshot = '',
    options: SnapshotOptions,
    logger: any,
  ): Promise<any[]> {
    const rootResource = this.percyClient.makeResource({
      resourceUrl: rootResourceUrl,
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    const discoveredResources = await this.assetDiscoveryService.discoverResources(
      rootResourceUrl,
      domSnapshot,
      options,
      logger,
    )

    return [rootResource].concat(discoveredResources)
  }

  buildLogResource(localPath: string) {
    const fileName = path.basename(localPath)
    const buffer = fs.readFileSync(path.resolve(localPath))
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')

    return this.percyClient.makeResource({
      resourceUrl: `/${fileName}`,
      mimetype: 'text/plain',
      localPath,
      sha,
    })
  }

  create(
    name: string,
    resources: any[],
    options: SnapshotOptions = {},
    clientInfo: string | null = null,
    environmentInfo: string | null = null,
  ): Promise<any> {
    const snapshotCreationPromise: Promise<any> = this.percyClient.createSnapshot(
      this.buildId, resources, { name, ...options, minimumHeight: options.minHeight, clientInfo, environmentInfo },
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
