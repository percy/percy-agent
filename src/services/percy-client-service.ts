import {URL} from 'url'

export default class PercyClientService {
  percyClient: any

  constructor() {
    const PercyClient = require('percy-client')

    this.percyClient = new PercyClient({
      apiUrl: process.env.PERCY_API,
      clientInfo: this.clientInfo(),
      token: process.env.PERCY_TOKEN,
    })
  }

  parseRequestPath(url: string): string {
    const parsedURL = new URL(url)

    // Excellent docs about what this is made up of here
    // https://nodejs.org/docs/latest-v8.x/api/url.html#url_url_strings_and_url_objects
    const strippedAnchor = parsedURL.protocol
                       + '//'
                       + parsedURL.host
                       + parsedURL.pathname
                       + (parsedURL.search || '')
    return strippedAnchor
  }

  private clientInfo(): string {
    const version = require('../../package.json').version
    return `percy-agent/${version}`
  }
}
