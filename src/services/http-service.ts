import * as express from 'express'

export default class HttpService {
  private express: express.Application
  private port: number

  public constructor(port: number) {
    this.express = express()
    this.port = port
    this.express.use(express.static('src/public'))
  }

  public start() {
    this.express.listen(this.port, () => {
      console.log(`percy-agent has started on port ${this.port}`)
    })
  }
}
