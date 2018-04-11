import * as express from 'express'
import * as cors from 'cors'
import {Server} from 'http'
import SnapshotService from './snapshot-service'

export default class HttpService {
  readonly app: express.Application
  server: Server | null = null

  constructor() {
    this.app = express()
    this.app.use(cors())
    this.app.use(express.static('src/public'))
    this.app.post('/snapshots', this.handleSnapshots)
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

  private handleSnapshots(request: express.Request, response: express.Response) {
    console.log(`${request.method} ${request.url}`)
    console.log('Headers:' + request.headers)

    let userAgent = request.headers['user-agent']
    let message = {message: `Response from percy-agent. Your user agent was: ${userAgent}`}

    const snapshotService = new SnapshotService()
    snapshotService.createSnapshot('test')

    response.json(message)
  }
}
