import PercyClientService from './percy-client-service'
import RequestService from './request-service'
import { build } from '@oclif/parser/lib/flags';

export default class SnapshotService extends PercyClientService {
  async createSnapshot(
    buildId: number,
    name: string,
    rootResourceUrl: string,
    domSnapshot: string = '',
    requestManifest: string[] = [],
    enableJavaScript: boolean = false,
    widths: number[] = [1280],
    minimumHeight: number = 500,
  ): Promise<number | null> {
    let rootResource = this.percyClient.makeResource({
      resourceUrl: this.parseUrlPath(rootResourceUrl),
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
      buildId, resources, {name, widths, enableJavaScript, minimumHeight}
    ).then(async (response: any) => {
      snapshotId = parseInt(response.body.data.id)
      console.log(`[info] SnapshotService#createSnapshot[Snapshot ${snapshotId}] created`)

      console.log(`[info] SnapshotService#createSnapshot[Snapshot ${snapshotId}] uploading missing resources...`)

      await this.percyClient.uploadMissingResources(buildId, response, resources).then(() => {
        console.log(`[info] SnapshotService#createSnapshot[Snapshot ${snapshotId}] done uploading missing resources`)
        return snapshotId
      })
    }, (error: any) => {
      console.log(`[error] SnapshotService#createSnapshot ${error}`)
    })

    console.log(`[info] SnapshotService#createSnapshot returning ${snapshotId}`)
    return snapshotId
  }

  async finalizeSnapshot(snapshotId: number) {
    await this.percyClient.finalizeSnapshot(snapshotId)
      .then(() => {
        console.log(`[info] SnapshotService#finalizeSnapshot[Snapshot ${snapshotId}]: finalized`)
      }, (error: any) => {
        console.log(`[error] SnapshotService#finalizeSnapshot: ${error}`)
      })
  }
}
