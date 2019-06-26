import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import { Configuration } from '../configuration/configuration'
import {SnapshotOptions} from '../percy-agent-client/snapshot-options'
import logger, {profile} from '../utils/logger'
import {HEALTHCHECK_PATH, SNAPSHOT_PATH, STOP_PATH} from './agent-service-constants'
import BuildService from './build-service'
import ConfigurationService from './configuration-service'
import Constants from './constants'
import ProcessService from './process-service'
import SnapshotService from './snapshot-service'

export class AgentService {
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

    this.app.post(SNAPSHOT_PATH, this.handleSnapshot.bind(this))
    this.app.post(STOP_PATH, this.handleStop.bind(this))
    this.app.get(HEALTHCHECK_PATH, this.handleHealthCheck.bind(this))

    this.buildService = new BuildService()
  }

  async start(configuration: Configuration) {
    this.buildId = await this.buildService.create()

    if (this.buildId !== null) {
      console.log(`DAVE: ${configuration.agent.port}`)
      this.server = this.app.listen(configuration.agent.port)
      this.snapshotService = new SnapshotService(
        this.buildId,
        configuration.agent['asset-discovery'],
      )

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

    // truncate domSnapshot for the logs if it's very large
    let domSnapshotLog = request.body.domSnapshot
    if (domSnapshotLog.length > Constants.MAX_LOG_LENGTH) {
      domSnapshotLog = domSnapshotLog.substring(0, Constants.MAX_LOG_LENGTH)
      domSnapshotLog += `[truncated at ${Constants.MAX_LOG_LENGTH}]`
    }

    logger.debug('handling snapshot:')
    logger.debug(`-> headers: ${JSON.stringify(request.headers)}`)
    logger.debug(`-> name: ${request.body.name}`)
    logger.debug(`-> url: ${request.body.url}`)
    logger.debug(`-> clientInfo: ${request.body.clientInfo}`)
    logger.debug(`-> environmentInfo: ${request.body.environmentInfo}`)
    logger.debug(`-> domSnapshot: ${domSnapshotLog}`)

    if (!this.snapshotService) { return response.json({success: false}) }

    const configuration = new ConfigurationService().configuration
    const snapshotOptions: SnapshotOptions = {
      widths: request.body.widths || configuration.snapshot.widths,
      enableJavaScript: request.body.enableJavaScript,
      minHeight: request.body.minHeight || configuration.snapshot['min-height'],
    }

    const domSnapshot = request.body.domSnapshot

    if (domSnapshot.length > Constants.MAX_FILE_SIZE_BYTES) {
      logger.info(`snapshot skipped[max_file_size_exceeded]: '${request.body.name}'`)
      return response.json({success: true})
    }

    const resources = await this.snapshotService.buildResources(
      request.body.url,
      domSnapshot,
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
