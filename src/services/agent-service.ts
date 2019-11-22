import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import { Server } from 'http'
import * as os from 'os'
import * as path from 'path'
import { Configuration } from '../configuration/configuration'
import { SnapshotConfiguration } from '../configuration/snapshot-configuration'
import { SnapshotOptions } from '../percy-agent-client/snapshot-options'
import logger, { createFileLogger, profile } from '../utils/logger'
import { HEALTHCHECK_PATH, SNAPSHOT_PATH, STOP_PATH } from './agent-service-constants'
import BuildService from './build-service'
import Constants from './constants'
import ProcessService from './process-service'
import SnapshotService from './snapshot-service'

export class AgentService {
  buildService: BuildService
  snapshotService: SnapshotService | null = null

  private readonly app: express.Application
  private readonly publicDirectory: string = `${__dirname}/../../dist/public`
  private snapshotCreationPromises: any[] = []
  private snapshotConfig: SnapshotConfiguration | any = {}
  private server: Server | null = null
  private buildId: number | null = null

  constructor() {
    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json({ limit: '50mb' }))
    this.app.use(express.static(this.publicDirectory))

    this.app.post(SNAPSHOT_PATH, this.handleSnapshot.bind(this))
    this.app.post(STOP_PATH, this.handleStop.bind(this))
    this.app.get(HEALTHCHECK_PATH, this.handleHealthCheck.bind(this))

    this.buildService = new BuildService()
  }

  async start(configuration: Configuration) {
    this.snapshotConfig = configuration.snapshot
    this.buildId = await this.buildService.create()

    if (this.buildId !== null) {
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
    const rootURL = request.body.url
    let domSnapshotLog = request.body.domSnapshot
    if (domSnapshotLog.length > Constants.MAX_LOG_LENGTH) {
      domSnapshotLog = domSnapshotLog.substring(0, Constants.MAX_LOG_LENGTH)
      domSnapshotLog += `[truncated at ${Constants.MAX_LOG_LENGTH}]`
    }

    const snapshotLog = path.join(os.tmpdir(), `percy.${Date.now()}.log`)
    const snapshotLogger = createFileLogger(snapshotLog)
    snapshotLogger.debug('handling snapshot:')
    snapshotLogger.debug(`-> headers: ${JSON.stringify(request.headers)}`)
    snapshotLogger.debug(`-> name: ${request.body.name}`)
    snapshotLogger.debug(`-> url: ${request.body.url}`)
    snapshotLogger.debug(`-> clientInfo: ${request.body.clientInfo}`)
    snapshotLogger.debug(`-> environmentInfo: ${request.body.environmentInfo}`)
    snapshotLogger.debug(`-> domSnapshot: ${domSnapshotLog}`)

    if (!this.snapshotService) { return response.json({ success: false }) }

    // trim the string of whitespace and concat per-snapshot CSS with the globally specified CSS
    const percySpecificCSS = this.snapshotConfig['percy-css'].concat(request.body.percyCSS || '').trim()
    const hasWidths = !!request.body.widths && request.body.widths.length
    const snapshotOptions: SnapshotOptions = {
      percyCSS: percySpecificCSS,
      requestHeaders: request.body.requestHeaders,
      widths: hasWidths ? request.body.widths : this.snapshotConfig.widths,
      enableJavaScript: request.body.enableJavaScript != null
        ? request.body.enableJavaScript
        : this.snapshotConfig['enable-javascript'],
      minHeight: request.body.minHeight || this.snapshotConfig['min-height'],
    }

    let domSnapshot = request.body.domSnapshot

    if (domSnapshot.length > Constants.MAX_FILE_SIZE_BYTES) {
      logger.info(`snapshot skipped[max_file_size_exceeded]: '${request.body.name}'`)
      return response.json({ success: true })
    }
    // tslint:disable-next-line
    let resolve, reject
    const deferred = new Promise((...args) => [resolve, reject] = args)
    this.snapshotCreationPromises.push(deferred)

    let resources = await this.snapshotService.buildResources(
      rootURL,
      domSnapshot,
      snapshotOptions,
      snapshotLogger,
    )

    const percyCSSFileName = `percy-specific.${Date.now()}.css` as string

    // Inject the link to the percy specific css if the option is passed
    // This must be done _AFTER_ asset discovery, or you risk their server
    // serving a response for this CSS we're injecting into the DOM
    if (snapshotOptions.percyCSS) {
      const cssLink = `<link data-percy-specific-css rel="stylesheet" href="/${percyCSSFileName}" />`
      domSnapshot = domSnapshot.replace(/<\/body>/i, cssLink + '$&')
    }

    resources = resources.concat(
      this.snapshotService.buildRootResource(rootURL, domSnapshot),
      // @ts-ignore we won't write anything if css is not is passed
      this.snapshotService.buildPercyCSSResource(rootURL, percyCSSFileName, snapshotOptions.percyCSS, snapshotLogger),
      this.snapshotService.buildLogResource(snapshotLog),
    )

    this.snapshotService.create(
      request.body.name,
      resources,
      snapshotOptions,
      request.body.clientInfo,
      request.body.environmentInfo,
    ).then(resolve).catch(reject)

    logger.info(`snapshot taken: '${request.body.name}'`)

    profile('agentService.handleSnapshot')
    return response.json({ success: true })
  }

  private async handleStop(_: express.Request, response: express.Response) {
    await this.stop()
    new ProcessService().cleanup()
    return response.json({ success: true })
  }

  private async handleHealthCheck(_: express.Request, response: express.Response) {
    return response.json({ success: true })
  }
}
