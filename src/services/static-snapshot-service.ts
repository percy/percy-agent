import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as globby from 'globby'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
import { StaticSnapshotsConfiguration } from '../configuration/static-snapshots-configuration'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'
import ConfigurationService from './configuration-service'

// Use this instead of importing PercyAgent - we only want the compiled version
declare var PercyAgent: any

export default class StaticSnapshotService {
  readonly configuration: StaticSnapshotsConfiguration
  private readonly app: express.Application
  private server: Server | null = null

  constructor(configuration?: StaticSnapshotsConfiguration) {
    this.app = express()
    this.configuration = configuration || ConfigurationService.DEFAULT_CONFIGURATION['static-snapshots']

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))

    this.app.use(this.configuration['base-url'], express.static(this.configuration.path))
  }

  async start() {
    logger.info(`serving static site at ${this._buildLocalUrl()}`)
    this.server = await this.app.listen(this.configuration.port)
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

      await page.evaluate((url) => {
        const percyAgentClient = new PercyAgent()
        const parsedURL = new URL(url)
        const snapshotName = parsedURL.pathname || url

        return percyAgentClient.snapshot(snapshotName)
      }, url)
    }

    browser.close()
  }

  async stop() {
    if (this.server) { await this.server.close() }

    logger.info(`shutting down static site at ${this._buildLocalUrl()}`)
  }

  _buildLocalUrl() {
    return `http://localhost:${this.configuration.port}${this.configuration['base-url']}`
  }

  async _buildPageUrls() {
    // We very intentially remove '' values from these globs because that matches every file
    const ignoreGlobs = this.configuration['ignore-files']
      .split(',')
      .filter((value) => value !== '')

    const snapshotGlobs = this.configuration['snapshot-files']
      .split(',')
      .filter((value) => value !== '')

    const globOptions = {
      cwd: this.configuration.path,
      ignore: ignoreGlobs,
    }

    const paths = await globby(snapshotGlobs, globOptions)
    const pageUrls = [] as any
    const baseUrl = this._buildLocalUrl()

    for (const path of paths) {
      pageUrls.push(baseUrl + path)
    }

    return pageUrls
  }
}
