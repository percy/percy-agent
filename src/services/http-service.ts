import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import BuildService from './build-service'
import SnapshotService from './snapshot-service'

export default class HttpService {
  readonly app: express.Application
  server: Server | null = null
  buildId: number | null = null

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))
    this.app.use(express.static('src/public'))

    this.app.post('/percy/snapshot', this.handleSnapshot.bind(this))
    this.app.post('/percy/finalize', this.handleBuildFinalize.bind(this))
    this.app.post('/percy/stop', this.handleStop.bind(this))
  }

  async start(port: number) {
    this.buildId = await new BuildService().createBuild()
    this.server = this.app.listen(port)
  }

  async stop() {
    if (this.server) { this.server.close() }
  }

  private async handleSnapshot(request: express.Request, response: express.Response) {
    // Use this once we have snapshot user agent support
    // let userAgent = request.headers['user-agent']

    const snapshotService = new SnapshotService()

    if (this.buildId) {
      let snapshotId = await snapshotService.createSnapshot(
        this.buildId,
        request.body.name,
        request.body.url,
        request.body.domSnapshot,
        request.body.requestManifest,
        request.body.enableJavascript,
        request.body.widths
      )

      if (snapshotId) {
        await snapshotService.finalizeSnapshot(snapshotId)
      }
    }

    console.log('[info] HttpService#handleSnapshot: OK')
    return response.send('ok')
  }

  private async handleBuildFinalize(_request: express.Request, response: express.Response) {
    if (this.buildId) {
      const buildService = new BuildService()
      await buildService.finalizeBuild(this.buildId).catch(error => {
        console.log(`[error] HttpService#handleBuildFinalize: ${error}`)
        return response.send('ok')
      })
    }

    console.log('[info] HttpService#handleBuildFinalize: OK')
    return response.send('ok')
  }

  private async handleStop(_request: express.Request, response: express.Response) {
    await this.stop()

    console.log('[info] HttpService#handleStop: OK')
    return response.send('ok')
  }
}
