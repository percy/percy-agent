import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
import * as walk from 'walk'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'
import {StaticSnapshotOptions} from './static-snapshot-options'

// Use this instead of importing PercyAgent - we only want the compiled version
declare var PercyAgent: any

export default class StaticSnapshotService {
  readonly options: StaticSnapshotOptions
  private readonly app: express.Application
  private server: Server | null = null

  constructor(options: StaticSnapshotOptions) {
    this.app = express()
    this.options = options

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))

    this.app.use(options.baseUrl, express.static(options.snapshotDirectory))
  }

  async start() {
    logger.info(`serving static site at http://localhost:${this.options.port}${this.options.baseUrl}`)
    this.server = await this.app.listen(this.options.port)
  }

  async snapshotAll() {
    logger.debug('taking snapshots of static site')

    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false,
    })

    const percyAgentClientFilename = agentJsFilename()
    const page = await browser.newPage()

    const pageUrls = await this._buildPageUrls()

    for (const url of pageUrls) {
      logger.debug(`visiting ${url}`)

      await page.goto(url)

      await page.addScriptTag({
        path: percyAgentClientFilename,
      })

      await page.evaluate((name) => {
        const percyAgentClient = new PercyAgent()
        return percyAgentClient.snapshot(name)
      }, url)
    }

    browser.close()
  }

  async stop() {
    logger.info('stopping static snapshot service...')

    if (this.server) { await this.server.close() }
  }

  async _buildPageUrls() {
    const baseUrl = `http://localhost:${this.options.port}`
    const pageUrls = [] as any

    const walkOptions = {
      listeners: {
        file: (root: any, fileStats: any, next: any) => {
          // make sure the file is part of the capture group, and not part of the ignore group
          const snapshotResult = fileStats.name.match(this.options.snapshotFilesRegex)
          const ignoreResult = fileStats.name.match(this.options.ignoreFilesRegex)

          let isCapturableFile = false
          let isIgnorableFile = false

          // the match result can be null or an array. if an array the first result can
          // still be an empty string which is the same as no match found, but looking
          // for an index when the result is null will throw an error so the ifs are needed
          if (snapshotResult) {
            isCapturableFile = snapshotResult[0] ? true : false
          }

          if (ignoreResult) {
            isIgnorableFile = ignoreResult[0] ? true : false
          }

          const shouldVisitFile = isCapturableFile && !isIgnorableFile

          if (shouldVisitFile) {
            pageUrls.push(baseUrl + root.replace(this.options.snapshotDirectory, '') + '/' + fileStats.name)
          }
        },
      },
    }

    await walk.walkSync(this.options.snapshotDirectory, walkOptions)

    return pageUrls
  }
}
