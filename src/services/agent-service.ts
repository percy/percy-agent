import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import BuildService from './build-service'
import SnapshotService from './snapshot-service'
import logger from '../utils/logger'

export default class AgentService {
  readonly app: express.Application
  server: Server | null = null
  buildId: number | null = null

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))
    this.app.use(express.static('dist/public'))

    this.app.post('/percy/snapshot', this.handleSnapshot.bind(this))
    this.app.post('/percy/finalize', this.handleBuildFinalize.bind(this))
    this.app.post('/percy/stop', this.handleStop.bind(this))
  }

  async start(port: number) {
    this.buildId = await new BuildService().createBuild()
    this.server = this.app.listen(port)
  }

  async stop() {
    if (this.buildId) {
      await new BuildService().finalizeBuild(this.buildId)
      this.buildId = null
    }

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

    logger.info('AgentService#handleSnapshot: OK')
    return response.json({sucess: true})
  }

  private async handleBuildFinalize(_request: express.Request, response: express.Response) {
    if (this.buildId) {
      const buildService = new BuildService()
      await buildService.finalizeBuild(this.buildId).catch(error => {
        console.log(`[error] AgentService#handleBuildFinalize: ${error}`)
        return response.json({sucess: true})
      })
    }

    logger.info('AgentService#handleBuildFinalize: OK')
    return response.json({sucess: true})
  }

  private async handleStop(_request: express.Request, response: express.Response) {
    await this.stop()

    logger.info('AgentService#handleStop: OK')

    return response.json({sucess: true})
  }
}
