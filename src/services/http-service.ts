const express = require('express')

export class HttpService {
  app: any

  constructor(port: number) {
    this.app = express()
    this.app.use(express.static('src/public'))

    this.app.listen(port, () => {
      console.log(`percy-agent has started on port ${port}`)
    })
  }
  stop() {
    this.app.stop
  }
}
