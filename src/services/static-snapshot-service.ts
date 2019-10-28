import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as globby from 'globby'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import { StaticSnapshotsConfiguration } from '../configuration/static-snapshots-configuration'
import { parseGlobs } from '../utils/configuration'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'

// Use this instead of importing PercyAgent - we only want the compiled version
declare var PercyAgent: any

export default class StaticSnapshotService {
  readonly configuration: StaticSnapshotsConfiguration
  private readonly app: express.Application
  private server: Server | null = null

  constructor(configuration?: StaticSnapshotsConfiguration) {
    this.app = express()
    this.configuration = configuration || DEFAULT_CONFIGURATION['static-snapshots']

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

    // Do not follow redirects to ensure we don't navigate to another page
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.redirectChain().length) {
        logger.debug(`Skipping redirect: ${request.url()}`)
        request.abort()
      } else {
        request.continue()
      }
    })

    const pageUrls = await this._buildPageUrls()

    for (const url of pageUrls) {
      logger.debug(`visiting ${url}`)

      try {
        await page.goto(url, { waitUntil: 'networkidle2' })
      } catch (error) {
        logger.error(`Failed to navigate to ${url}, skipping. Error: ${error}`)
      }

      try {
        await page.addScriptTag({
          path: percyAgentClientFilename,
        })

        await page.evaluate((url) => {
          const percyAgentClient = new PercyAgent()
          const parsedURL = new URL(url)
          const snapshotName = parsedURL.pathname || url

          return percyAgentClient.snapshot(snapshotName)
        }, url)
      } catch (error) {
        logger.error(`Failed to inject agent JS: ${error}`)
      }
    }

    await browser.close()
  }

  async stop() {
    if (this.server) { await this.server.close() }

    logger.info(`shutting down static site at ${this._buildLocalUrl()}`)
  }

  _buildLocalUrl() {
    return `http://localhost:${this.configuration.port}${this.configuration['base-url']}`
  }

  async _buildPageUrls() {
    const globs = parseGlobs(this.configuration['snapshot-files'])
    const ignore = parseGlobs(this.configuration['ignore-files'])
    const paths = await globby(globs, { cwd: this.configuration.path, ignore })
    const baseUrl = this._buildLocalUrl()

    return paths.map((path) => baseUrl + path)
  }
}
