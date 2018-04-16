import {URL} from 'url'

export default class PercyClientService {
  percyClient: any

  constructor() {
    let PercyClient = require('percy-client')

    this.percyClient = new PercyClient({
      token: process.env.PERCY_TOKEN,
      apiURL: process.env.PERCY_API,
      clientInfo: this.clientInfo()
    })
  }

  parseUrlPath(url: string): string {
    let parsedURL = new URL(url)
    return parsedURL.pathname + (parsedURL.search ? `?${parsedURL.search}` : '')
  }

  private clientInfo(): string {
    return 'percy-agent/XX'
  }
}
