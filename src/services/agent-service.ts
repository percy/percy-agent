import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import BuildService from './build-service'
import SnapshotService from './snapshot-service'
import logger from '../utils/logger'
import ProcessService from './process-service'

export default class AgentService {
  readonly app: express.Application
  server: Server | null = null
  snapshotService: SnapshotService | null = null
  buildService: BuildService

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))
    this.app.use(express.static('dist/public'))

    this.app.post('/percy/snapshot', this.handleSnapshot.bind(this))
    this.app.post('/percy/stop', this.handleStop.bind(this))

    this.app.get('/percy/healthcheck', this.handleHealthCheck.bind(this))

    this.buildService = new BuildService()
  }

  async start(port: number) {
    this.server = this.app.listen(port)

    let buildId = await this.buildService.createBuild()
    this.snapshotService = new SnapshotService(buildId)
  }

  async stop() {
    await this.buildService.finalizeBuild()
    if (this.server) { await this.server.close() }
  }

  private async handleSnapshot(request: express.Request, response: express.Response) {
    // Use this once we have snapshot user agent support
    // let userAgent = request.headers['user-agent']

    if (this.snapshotService) {
      await this.snapshotService.createSnapshot(
        request.body.name,
        request.body.url,
        request.body.domSnapshot,
        request.body.requestManifest,
        request.body.enableJavascript,
        request.body.widths
      )

      logger.info(`snapshot taken: '${request.body.name}'`)

      return response.json({success: true})
    }

    return response.json({success: false})
  }

  private async handleStop(_request: express.Request, response: express.Response) {
    await this.stop()
    await new ProcessService().kill()
    return response.json({success: true})
  }

  private async handleHealthCheck(_request: express.Request, response: express.Response) {
    return response.json({success: true})
  }
}
