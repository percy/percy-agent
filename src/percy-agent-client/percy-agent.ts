import Constants from '../services/constants'
import {ClientOptions} from './client-options'
import {PercyAgentClient} from './percy-agent-client'
import {cleanSerializedCssOm, serializeCssOm} from './serialize-cssom'
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

    const snapshotString = doctype + domClone.outerHTML

    // Remove all the additions we've made to the original DOM.
    // Ideally we would make a deep clone of the original DOM at the start of this
    // method, and operate on that, but this turns out to be hard to do while
    // retaining CSS OM and input element state. Instead, we carefully remove what we added.
    cleanSerializedCssOm(documentObject)

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

  private serializeInputElements(doc: HTMLDocument): HTMLDocument {
    const domClone = doc.documentElement
    const formNodes = domClone.querySelectorAll('input, textarea')
    const formElements = Array.prototype.slice.call(formNodes)

    formElements.forEach((elem: HTMLInputElement) => {
      switch (elem.type) {
      case 'checkbox':
      case 'radio':
        if (elem.checked) {
          elem.setAttribute('checked', '')
        }
        break
      case 'textarea':
        // setting text or value does not work but innerText does
        elem.innerText = elem.value
      default:
        elem.setAttribute('value', elem.value)
      }
    })

    return doc
  }

  private stabilizeDOM(doc: HTMLDocument): HTMLElement {
    let stabilizedDOM = doc
    stabilizedDOM = serializeCssOm(stabilizedDOM)
    stabilizedDOM = this.serializeInputElements(stabilizedDOM)
    // more calls to come here

    return stabilizedDOM.documentElement
  }
}
