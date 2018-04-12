export class PercyClientService {
  percyClient: any

  constructor() {
    let PercyClient = require('percy-client')

    this.percyClient = new PercyClient({
      token: process.env.PERCY_TOKEN,
      apiURL: process.env.PERCY_API,
      clientInfo: this.clientInfo()
    })
  }

  private clientInfo(): string {
    return 'percy-agent/XX'
  }
}
