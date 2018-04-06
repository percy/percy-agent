import * as express from 'express'
import {Server} from 'http'

export default class HttpService {
  readonly express: express.Application
  server: Server | null

  constructor() {
    this.express = express()
    this.express.use(express.static('src/public'))
    this.server = null
  }

  /**
   * Starts serving the `/src/public/` directory on the supplied port.
   */
  start(port: number) {
    this.server = this.express.listen(port)
  }

  /**
   * Stops serving the `/src/public/` directory.
   */
  stop() {
    if (this.server) { this.server.close() }
  }
}
