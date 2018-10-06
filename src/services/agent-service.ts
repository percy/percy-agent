import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import BuildService from './build-service'
import SnapshotService from './snapshot-service'
import logger, {profile} from '../utils/logger'
import ProcessService from './process-service'
import {AgentOptions} from './agent-options'

export default class AgentService {
  readonly app: express.Application
  readonly publicDirectory: string = `${__dirname}/../../dist/public`

  buildService: BuildService
  snapshotService: SnapshotService | null = null

  snapshotCreationPromises: any[] = []
  resourceUploadPromises: any[] = []
  server: Server | null = null
  buildId: number | null = null

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))
    this.app.use(express.static(this.publicDirectory))

    this.app.post('/percy/snapshot', this.handleSnapshot.bind(this))
    this.app.post('/percy/stop', this.handleStop.bind(this))

    this.app.get('/percy/healthcheck', this.handleHealthCheck.bind(this))

    this.buildService = new BuildService()
  }

  async start(options: AgentOptions = {}) {
    this.server = this.app.listen(options.port)

    this.buildId = await this.buildService.create()
    this.snapshotService = new SnapshotService(this.buildId, {networkIdleTimeout: options.networkIdleTimeout})
    await this.snapshotService.assetDiscoveryService.setup()
  }

  async stop() {
    logger.info('stopping percy-agent...')

    logger.info(`waiting for ${this.snapshotCreationPromises.length} snapshots to complete...`)
    await Promise.all(this.snapshotCreationPromises)
    logger.info('done.')

    if (this.snapshotService) {
      await this.snapshotService.assetDiscoveryService.teardown()
    }

    await this.buildService.finalize()
    if (this.server) { await this.server.close() }
  }

  private async handleSnapshot(request: express.Request, response: express.Response) {
    profile('agentService.handleSnapshot')

    logger.debug('handling snapshot:')
    logger.debug(`-> headers: ${JSON.stringify(request.headers)}`)
    logger.debug(`-> name: ${JSON.stringify(request.body.name)}`)
    logger.debug(`-> url: ${JSON.stringify(request.body.url)}`)
    logger.debug(`-> widths: ${JSON.stringify(request.body.widths)}`)
    logger.debug(`-> enableJavascript: ${JSON.stringify(request.body.enableJavascript)}`)
    logger.debug(`-> clientInfo: ${JSON.stringify(request.body.clientInfo)}`)
    logger.debug(`-> environmentInfo: ${JSON.stringify(request.body.environmentInfo)}`)

    if (!this.snapshotService) { return response.json({success: false}) }

    let resources = await this.snapshotService.buildResources(
      request.body.url,
      request.body.domSnapshot,
    )

    let snapshotCreation = this.snapshotService.create(
      request.body.name,
      resources,
      request.body.enableJavascript,
      request.body.widths,
    )

    this.snapshotCreationPromises.push(snapshotCreation)
    logger.info(`snapshot taken: '${request.body.name}'`)

    profile('agentService.handleSnapshot')
    return response.json({success: true})
  }

  private async handleStop(_request: express.Request, response: express.Response) {
    await this.stop()
    new ProcessService().kill()
    return response.json({success: true})
  }

  private async handleHealthCheck(_request: express.Request, response: express.Response) {
    return response.json({success: true})
  }
}
