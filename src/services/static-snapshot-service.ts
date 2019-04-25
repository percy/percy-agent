import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as globby from 'globby'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
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
    logger.info(`serving static site at ${this._buildLocalUrl()}`)
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

  _buildLocalUrl() {
    return `http://localhost:${this.options.port}${this.options.baseUrl}`
  }

  async _buildPageUrls() {
    const baseUrl = this._buildLocalUrl()
    const pageUrls = [] as any

    const globOptions = {
      cwd: this.options.snapshotDirectory,
      ignore: this.options.ignoreGlob,
    }

    const paths = await globby(this.options.snapshotGlob, globOptions)

    for (const path of paths) {
      pageUrls.push(baseUrl + path)
    }

    return pageUrls
  }
}
