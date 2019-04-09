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
  private readonly app: express.Application
  private readonly options: StaticSnapshotOptions
  private server: Server | null = null

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

    const pageUrls = [] as any
    const baseUrl = `http://localhost:${this.options.port}`

    const walkOptions = {
      listeners: {
        file: (root: any, fileStats: any, next: any) => {
          // make sure the file is part of the capture group, and not part of the ignore group
          const isCapturableFile = fileStats.name.match(this.options.snapshotCaptureRegex)[0]
          const isIgnorableFile = fileStats.name.match(this.options.snapshotIgnoreRegex)[0]
          const shouldVisitFile = isCapturableFile && !isIgnorableFile

          if (shouldVisitFile) {
            // for each file need to build a URL for the browser to visit
            pageUrls.push(baseUrl + root.replace(this.options.staticAssetDirectory, '') + '/' + fileStats.name)
          }
        },
      },
    }

    await walk.walkSync(this.options.staticAssetDirectory, walkOptions)
    console.log(pageUrls)

    // await pageUrls.forEach(async (url: any) => {
    //   await page.goto(url)

    //   const percyAgentClientFilename = agentJsFilename()

    //   await page.addScriptTag({
    //     path: percyAgentClientFilename,
    //   })

    //   const domSnapshot = await page.evaluate((name) => {
    //     const percyAgentClient = new PercyAgent()
    //     return percyAgentClient.snapshot(name)
    //   }, url)
    // })

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

    // then, for each file:
    // use file name as snapshot name
    // visit the page
    // inject percy-agent js
    // do snapshot

    // just testing one page for now
    // const url = `http://localhost:${this.options.port}/`
    // const url = pageUrls[5]

    // await page.goto(url)
    // const percyAgentClientFilename = agentJsFilename()

    // await page.addScriptTag({
    //   path: percyAgentClientFilename,
    // })

    // const domSnapshot = await page.evaluate((name) => {
    //   const percyAgentClient = new PercyAgent()
    //   return percyAgentClient.snapshot(name)
    // }, url)

    browser.close()
  }

  async stop() {
    logger.info('stopping static snapshot service...')

    if (this.server) { await this.server.close() }
  }
}
