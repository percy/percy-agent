import Constants from '../services/constants'
import {ClientOptions} from './client-options'
import {PercyAgentClient} from './percy-agent-client'
import {serializeCssOm} from './serialize-cssom'
import {cleanSerializedInputElements, serializeInputElements} from './serialize-input'
import {SnapshotOptions} from './snapshot-options'

export default class PercyAgent {
  clientInfo: string | null
  environmentInfo: string | null
  xhr: any
  handleAgentCommunication: boolean
  port: number
  domTransformation: any | null
  client: PercyAgentClient | null = null

  readonly defaultDoctype = '<!DOCTYPE html>'

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
    const domSnapshot = this.domSnapshot(documentObject)

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

  private domSnapshot(documentObject: Document): string {
    const doctype = this.getDoctype(documentObject)
    const dom = this.stabilizeDOM(documentObject)

    let domClone = dom.cloneNode(true) as HTMLElement

    // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
    // For example, if your test suite runs tests in an element inside a page that
    // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
    // the full page. Using a dom transformation is how you'd acheive that.
    if (this.domTransformation) {
      domClone = this.domTransformation(domClone)
    }

    cleanSerializedInputElements(documentObject)

    const snapshotString = doctype + domClone.outerHTML

    return snapshotString
  }

  private getDoctype(documentObject: Document): string {
    return documentObject.doctype ? this.doctypeToString(documentObject.doctype) : this.defaultDoctype
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId ? ` PUBLIC "${doctype.publicId}" ` : ''
    const systemDeclaration = doctype.systemId ? ` SYSTEM "${doctype.systemId}" ` : ''

    return `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>'
  }

  private stabilizeDOM(doc: HTMLDocument): HTMLElement {
    let stabilizedDOM = doc
    stabilizedDOM = serializeCssOm(stabilizedDOM)
    stabilizedDOM = serializeInputElements(stabilizedDOM)
    // more calls to come here

    return stabilizedDOM.documentElement
  }
}
