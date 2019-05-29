import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as globby from 'globby'
import {Server} from 'http'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import {URL} from 'url'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'
import {StaticSnapshotOptions} from './static-snapshot-options'

// Use this instead of importing PercyAgent - we only want the compiled version
declare var PercyAgent: any

export default class StaticSnapshotService {
  readonly options: StaticSnapshotOptions
  readonly virtualDir: string
  private readonly app: express.Application
  private router: express.Router
  private server: Server | null = null

  constructor(options: StaticSnapshotOptions) {
    this.app = express()
    this.options = options
    this.router = express.Router()
    this.virtualDir = '/__percy_virtual_dir'

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))

    this.app.use(this.router)

    // responding with html for request on the virtual directory allows
    // serving the actual image as a resource when the html has been parsed
    this.app.use(this.virtualDir, (request: express.Request, response: express.Response) => {
        const imagePath = path.join(this.options.baseUrl, request.url)
        response.send(`<img src="${imagePath}"/>`)
      })

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
    if (this.server) { await this.server.close() }

    logger.info(`shutting down static site at ${this._buildLocalUrl()}`)
  }

  _buildLocalUrl() {
    return `http://localhost:${this.options.port}${this.options.baseUrl}`
  }

  async _buildPageUrls() {
    const baseUrl = this._buildLocalUrl()
    const pageUrls = [] as any

    const globOptions = {
      cwd: this.options.snapshotDirectory,
      ignore: this.options.ignoreGlobs,
    }

    const paths = await globby(this.options.snapshotGlobs, globOptions)

    for (const filePath of paths) {
      // non-HTML files should be requested at the virtual directory endpoint
      const route = filePath.match(/^.*\.(html?)$/) ? '' : this.virtualDir
      const pageUrl = new URL(path.join(baseUrl, route, filePath)).toString()
      pageUrls.push(pageUrl)
    }

    return pageUrls
  }
}
