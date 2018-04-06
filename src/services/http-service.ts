import * as express from 'express'
import {Server} from 'http'

export default class HttpService {
  readonly app: express.Application
  server: Server | null

  constructor() {
    this.app = express()
    this.app.use(express.static('src/public'))
    this.server = null
  }

  /**
   * Starts serving the `/src/public/` directory on the supplied port.
   */
  start(port: number) {
    this.server = this.app.listen(port)
  }

  /**
   * Stops serving the `/src/public/` directory.
   */
  stop() {
    if (this.server) { this.server.close() }
  }
}
