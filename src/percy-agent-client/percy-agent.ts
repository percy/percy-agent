import Constants from '../services/constants'
import {ClientOptions} from './client-options'
import DOM from './dom'
import {PercyAgentClient} from './percy-agent-client'
import {SnapshotOptions} from './snapshot-options'

export default class PercyAgent {
  clientInfo: string | null
  environmentInfo: string | null
  xhr: any
  handleAgentCommunication: boolean
  port: number
  domTransformation: any | null
  client: PercyAgentClient | null = null

  constructor(options: ClientOptions = {}) {
    this.clientInfo = options.clientInfo || null
    this.environmentInfo = options.environmentInfo || null
    // Default to 'true' unless explicitly disabled.
    this.handleAgentCommunication = options.handleAgentCommunication !== false
    this.domTransformation = options.domTransformation || null
    this.port = options.port || Constants.PORT

    if (this.handleAgentCommunication) {
      this.xhr = options.xhr || XMLHttpRequest
      this.client = new PercyAgentClient(
        `http://localhost:${this.port}`,
        this.xhr,
      )
    }
  }

  snapshot(name: string, options: SnapshotOptions = {}) {
    const documentObject = options.document || document
    const domSnapshot = this.domSnapshot(documentObject, options)

    if (this.handleAgentCommunication && this.client) {
      this.client.post(Constants.SNAPSHOT_PATH, {
        name,
        url: documentObject.URL,
        // enableJavascript is deprecated. Use enableJavaScript
        enableJavaScript: options.enableJavaScript || options.enableJavascript,
        widths: options.widths,
        // minimumHeight is deprecated. Use minHeight
        minHeight: options.minHeight || options.minimumHeight,
        clientInfo: this.clientInfo,
        environmentInfo: this.environmentInfo,
        domSnapshot,
      })
    }

    return domSnapshot
  }

  private domSnapshot(documentObject: Document, options: SnapshotOptions = {}): string {
    const dom = new DOM(documentObject, {
      ...options,
      domTransformation: this.domTransformation,
    })

    return dom.snapshotString()
  }
}
