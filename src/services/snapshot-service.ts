import {PercyClientService} from './percy-client-service'

export default class SnapshotService extends PercyClientService {
  async createSnapshot(
    buildId: number,
    name: string,
    domSnapshot: string,
    enableJavaScript?: boolean,
    widths?: number[],
    minimumHeight?: number,
  ): Promise<number | null> {
    // const crypto = require('crypto')
    // let sha = crypto.createHash('sha256').update(domSnapshot).digest('hex')

    let rootResource = await this.percyClient.makeResource({
      resourceUrl: '/',
      content: domSnapshot,
      isRoot: true,
      mimetype: 'text/html',
    })

    let snapshotId = null

    await this.percyClient.createSnapshot(
      buildId, [rootResource], {name, widths, enableJavaScript, minimumHeight}
    ).then(async (response: any) => {
      snapshotId = parseInt(response.body.data.id)
      console.log(`[info] SnapshotService#createSnapshot[Snapshot ${snapshotId}] created`)

      await this.percyClient.uploadMissingResources(buildId, response, [rootResource])
    }).catch((error: any) => {
      console.log(`[error] SnapshotService#createSnapshot ${error}`)
    })

    return snapshotId
  }

  async finalizeSnapshot(snapshotId: number) {
    await this.percyClient.finalizeSnapshot(snapshotId)
      .then(() => {
        console.log(`[info] SnapshotService#finalizeSnapshot[Snapshot ${snapshotId}]: finalized`)
      })
      .catch((error: any) => {
        console.log(`[error] SnapshotService#finalizeSnapshot: ${error}`)
      })
  }
}
