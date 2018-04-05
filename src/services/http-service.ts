import * as express from 'express'

export default class HttpService {
  private readonly express: express.Application

  public constructor() {
    this.express = express()
    this.express.use(express.static('src/public'))
  }
  /** Starts serving the `/src/public/` directory on the supplied port */
  public start(port: number) {
    this.express.listen(port, () => {
      console.log(`percy-agent has started on port ${port}`)
    })
  }
}
