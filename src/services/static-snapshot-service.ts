import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import {Server} from 'http'
import * as puppeteer from 'puppeteer'
import logger from '../utils/logger'
import { agentJsFilename } from '../utils/sdk-utils'
import {StaticSnapshotOptions} from './static-snapshot-options'

// Use this instead of importing PercyAgent - we only want the browserified version
declare var PercyAgent: any

export default class StaticSnapshotService {
  constructor(options: StaticSnapshotOptions) {
    // logger.info('calling constructor...')
    this.app = express()
    this.options = options

    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))

    this.app.use(options.baseUrl, express.static(options.staticAssetDirectory))
  }

  start() {
    // start the app on the specified port
    this.server = this.app.listen(this.options.port)
  }

  async snapshotAll() {
    logger.info('starting static snapshot service...')

    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      handleSIGINT : false,
      headless: false,
    })

    const page = await browser.newPage()

    // need to make a list of pages to visit based on the html files
    // in the static asset dir

    // then, for each file:
    // use file name as snapshot name
    // visit the page
    // inject percy-agent js
    // do snapshot

    // just testing one page for now
    const url = `http://localhost:${this.options.port}/`

    await page.goto(url)
    const percyAgentClientFilename = agentJsFilename()

    await page.addScriptTag({
      path: percyAgentClientFilename,
    })

    const domSnapshot = await page.evaluate((name) => {
      const percyAgentClient = new PercyAgent()
      return percyAgentClient.snapshot(name)
    }, url)
  }

  async snapshotAll() {
    // logger.info('taking snapshots of the static site...')
  }

  async stop() {
    logger.info('stopping static snapshot service...')

    if (this.server) { await this.server.close() }
  }
}
