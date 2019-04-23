import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
import * as walk from 'walk'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'
import {StaticSnapshotOptions} from './static-snapshot-options'

// Use this instead of importing PercyAgent - we only want the browserified version
declare var PercyAgent: any

export default class StaticSnapshotService {
  private readonly app: express.Application
  private readonly options: StaticSnapshotOptions
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
    logger.info('starting static snapshot service...')
    // start the app on the specified port
    this.server = await this.app.listen(this.options.port)
  }

  async snapshotAll() {
    logger.info('taking snapshot of static site...')

    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false,
    })

    const page = await browser.newPage()

    const pageUrls = await this._buildPageUrls()

    for (const url of pageUrls) {
      await page.goto(url)
      const percyAgentClientFilename = agentJsFilename()

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

  // provide a simple way to test that the constructor recieved the expected arguments
  _getOptions() {
    return this.options
  }

  async _buildPageUrls() {
    const baseUrl = `http://localhost:${this.options.port}${this.options.baseUrl}`
    const pageUrls = [] as any

    const walkOptions = {
      listeners: {
        file: (root: any, fileStats: any, next: any) => {
          // make sure the file is part of the capture group, and not part of the ignore group
          const snapshotResult = fileStats.name.match(this.options.snapshotFilesRegex)
          const ignoreResult = fileStats.name.match(this.options.ignoreFilesRegex)

          let isCapturableFile = false
          let isIgnorableFile = false

          // the match result can be null or an array. if an array the first result
          // can still be an empty string which is the same as no match found, but looking
          // for an index when the result is null will throw an error

          if (snapshotResult) {
            isCapturableFile = snapshotResult[0] ? true : false
          }

          if (ignoreResult) {
            isIgnorableFile = ignoreResult[0] ? true : false
          }

          const shouldVisitFile = isCapturableFile && !isIgnorableFile

          if (shouldVisitFile) {
            // for each file need to build a URL for the browser to visit
            pageUrls.push(baseUrl + root.replace(this.options.snapshotDirectory, '') + '/' + fileStats.name)
          }
        },
      },
    }

    await walk.walkSync(this.options.snapshotDirectory, walkOptions)

    return pageUrls
  }
}
