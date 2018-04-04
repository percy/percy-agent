const express = require('express')

export default class HttpService {
  private app: any

  public constructor(port: number) {
    this.app = express()
    this.app.use(express.static('src/public'))

    this.app.listen(port, () => {
      console.log(`percy-agent has started on port ${port}`)
    })
  }

  public stop(): void {
    this.app.stop
  }
}
