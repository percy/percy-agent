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
    const doctype = this.getDoctype(documentObject)
    const domClone = this.cloneDOM(documentObject)
    let dom = this.stabilizeDOM(documentObject, domClone, options)

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

  /**
   * Takes the raw DOM from the snapshot, performs necessary tranforms, and
   * finally returns a deep clone of the DOM.
   *
   * This is the place you would modify the origial DOM _before_ the clone has
   * taken place.
   *
   */
  private cloneDOM(document: HTMLDocument): HTMLDocument {
    function createUID($el: Element) {
      const ID = '_' + Math.random().toString(36).substr(2, 9)

      $el.setAttribute('data-percy-element-id', ID)
    }

    const formNodes = document.querySelectorAll('input, textarea')
    const formElements = Array.from(formNodes)
    // loop through each for element and apply an ID for serialization later
    formElements.forEach((elem: Element) => createUID(elem))
    const clone = document.cloneNode(true) as HTMLDocument

    return clone
  }

  /**
   * Serialize parts of the DOM that aren't preserved in a deep clone. Anything
   * that is not encoded in the DOM tree needs to be accounted for here (CSSOM,
   * input values, canvas, etc).
   *
   */
  private stabilizeDOM(originalDocument: HTMLDocument, documentClone: HTMLDocument,
                       options: SnapshotOptions = {}): HTMLElement {
    let stabilizedDOMClone
    stabilizedDOMClone = serializeInputElements(originalDocument, documentClone)
    // We only want to serialize the CSSOM if JS isn't enabled.
    if (!options.enableJavaScript || !options.enableJavascript) {
      stabilizedDOMClone = serializeCssOm(originalDocument, documentClone)
    }

    return stabilizedDOMClone.documentElement
  }
}
