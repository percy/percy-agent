import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import { SnapshotOptions } from '../percy-agent-client/snapshot-options'
import configuration, {SnapshotConfiguration} from '../utils/configuration'
import logger, {profile} from '../utils/logger'
import {AgentOptions} from './agent-options'
import BuildService from './build-service'
import Constants from './constants'
import ProcessService from './process-service'
import SnapshotService from './snapshot-service'

export default class AgentService {
  buildService: BuildService
  snapshotService: SnapshotService | null = null

  private readonly app: express.Application
  private readonly publicDirectory: string = `${__dirname}/../../dist/public`
  private snapshotCreationPromises: any[] = []
  private server: Server | null = null
  private buildId: number | null = null

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))
    this.app.use(express.static(this.publicDirectory))

    this.app.post(Constants.SNAPSHOT_PATH, this.handleSnapshot.bind(this))
    this.app.post(Constants.STOP_PATH, this.handleStop.bind(this))

    this.app.get(Constants.HEALTHCHECK_PATH, this.handleHealthCheck.bind(this))

    this.buildService = new BuildService()
  }

  async start(options: AgentOptions = {}) {
    this.buildId = await this.buildService.create()

    if (this.buildId !== null) {
      this.server = this.app.listen(options.port)
      this.snapshotService = new SnapshotService(this.buildId, {
        networkIdleTimeout: options.networkIdleTimeout,
        assetDomains: options.assetDomains,
      })
      await this.snapshotService.assetDiscoveryService.setup()
      return
    }

    await this.stop()
  }

  async stop() {
    logger.info('stopping percy...')

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
    logger.debug(`-> body: ${JSON.stringify(request.body)}`)

    if (!this.snapshotService) { return response.json({success: false}) }

    const snapshotConfiguration = (configuration().snapshot || {}) as SnapshotConfiguration
    const snapshotOptions: SnapshotOptions = {
      widths: request.body.widths || snapshotConfiguration.widths,
      enableJavaScript: request.body.enableJavaScript,
      minHeight: request.body.minHeight || snapshotConfiguration['min-height'],
    }

    const resources = await this.snapshotService.buildResources(
      request.body.url,
      request.body.domSnapshot,
      snapshotOptions,
    )

    const snapshotCreation = this.snapshotService.create(
      request.body.name,
      resources,
      snapshotOptions,
      request.body.clientInfo,
      request.body.environmentInfo,
    )

    this.snapshotCreationPromises.push(snapshotCreation)
    logger.info(`snapshot taken: '${request.body.name}'`)

    profile('agentService.handleSnapshot')
    return response.json({success: true})
  }

  private async handleStop(_: express.Request, response: express.Response) {
    await this.stop()
    new ProcessService().kill()
    return response.json({success: true})
  }

  private async handleHealthCheck(_: express.Request, response: express.Response) {
    return response.json({success: true})
  }
}
