import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as fs from 'fs'
import {Server} from 'http'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import * as walk from 'walk'
import logger from '../utils/logger'
import {agentJsFilename} from '../utils/sdk-utils'
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

  async start() {
    logger.info('starting static snapshot service...')
    // start the app on the specified port
    this.server = await this.app.listen(this.options.port)
  }

  // does this work on windows????
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

  async snapshotAll() {
    // logger.info('taking snapshots of the static site...')
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
    const baseUrl = `http://localhost:${this.options.port}`
    const pageUrls = [] as any

    const walkOptions = {
      listeners: {
        file: (root: any, fileStats: any, next: any) => {
          // make sure the file is part of the capture group, and not part of the ignore group
          const isCapturableFile = fileStats.name.match(this.options.snapshotCaptureRegex)[0]
          const isIgnorableFile = fileStats.name.match(this.options.snapshotIgnoreRegex)[0]
          const shouldVisitFile = isCapturableFile && !isIgnorableFile

          if (shouldVisitFile) {
            // for each file need to build a URL for the browser to visit
            // does this need to change for windows????
            pageUrls.push(baseUrl + root.replace(this.options.staticAssetDirectory, '') + '/' + fileStats.name)
          }
        },
      },
    }

    await walk.walkSync(this.options.staticAssetDirectory, walkOptions)

    return pageUrls
  }
}
