import Constants from '../services/constants'
import {ClientOptions} from './client-options'
import {PercyAgentClient} from './percy-agent-client'
import {serializeCssOm} from './serialize-cssom'
import {serializeInputElements} from './serialize-input'
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
    const domClone = this.cloneDOM(documentObject)
    let dom = this.stabilizeDOM(documentObject, domClone)

    // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
    // For example, if your test suite runs tests in an element inside a page that
    // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
    // the full page. Using a dom transformation is how you'd acheive that.
    if (this.domTransformation) {
      dom = this.domTransformation(dom)
    }

    const snapshotString = doctype + dom.outerHTML

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

  private cloneDOM(document: HTMLDocument): HTMLDocument {
    // create the ID
    // Add it to the elment
    // TODO: remove any
    function createUID(el: any) {
      const ID = '_' + Math.random().toString(36).substr(2, 9)

      el.setAttribute('data-percy-element-id', ID)
    }

    const formNodes = document.querySelectorAll('input, textarea')
    const formElements = Array.prototype.slice.call(formNodes)
    formElements.forEach((elem: HTMLInputElement) => createUID(elem))
    const clone = document.cloneNode(true) as HTMLDocument

    return clone
  }

  private stabilizeDOM(originalDocument: HTMLDocument, documentClone: HTMLDocument): HTMLElement {
    let stabilizedDOMClone
    stabilizedDOMClone = serializeCssOm(originalDocument, documentClone)
    stabilizedDOMClone = serializeInputElements(originalDocument, documentClone)
    // more calls to come here

    return stabilizedDOMClone.documentElement
  }
}
