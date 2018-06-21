import {URL} from 'url'

export default class PercyClientService {
  percyClient: any

  constructor() {
    let PercyClient = require('percy-client')

    this.percyClient = new PercyClient({
      token: process.env.PERCY_TOKEN,
      apiUrl: process.env.PERCY_API,
      clientInfo: this.clientInfo()
    })
  }

  parseRequestPath(url: string): string {
    let parsedURL = new URL(url)

    // Excellent docs about what this is made up of here
    // https://nodejs.org/docs/latest-v8.x/api/url.html#url_url_strings_and_url_objects
    let strippedAnchor = parsedURL.protocol
                       + '//'
                       + parsedURL.host
                       + parsedURL.pathname
                       + (parsedURL.search ? `?${parsedURL.search}` : '')
    return strippedAnchor
  }

  private clientInfo(): string {
    return 'percy-agent/XX'
  }
}
