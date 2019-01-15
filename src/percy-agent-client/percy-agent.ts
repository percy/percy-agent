import {ClientOptions} from './client-options'
import {PercyAgentClient} from './percy-agent-client'
import {SnapshotOptions} from './snapshot-options'

export default class PercyAgent {
  clientInfo: string | null
  environmentInfo: string | null
  xhr: any
  postSnapshotDirectly: boolean
  port: number
  domTransformation: any | null
  client: PercyAgentClient | null

  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(options: ClientOptions = {}) {
    this.clientInfo = options.clientInfo || null
    this.environmentInfo = options.environmentInfo || null
    this.postSnapshotDirectly = options.postSnapshotDirectly !== false
    this.domTransformation = options.domTransformation || null
    this.port = options.port || 5338

    if (this.postSnapshotDirectly) {
      this.xhr = options.xhr || XMLHttpRequest
      this.client = new PercyAgentClient(
        `http://localhost:${this.port}`,
        this.xhr,
      )
    } else {
      this.xhr = null
      this.client = null
    }
  }

  snapshot(name: string, options: SnapshotOptions = {}) {
    const documentObject = options.document || document
    const domSnapshot = this.domSnapshot(documentObject)

    if (this.postSnapshotDirectly && this.client) {
      this.client.post('/percy/snapshot', {
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
    const dom = this.stabilizeDOM(documentObject.documentElement as HTMLElement) as HTMLElement

    let domClone = dom.cloneNode(true) as HTMLElement

    // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
    // For example, if your test suite runs tests in an element inside a page that
    // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
    // the full page. Using a dom transformation is how you'd acheive that.
    if (this.domTransformation) {
      domClone = this.domTransformation(domClone)
    }

    return doctype + domClone.outerHTML
  }

  private getDoctype(documentObject: Document): string {
    return documentObject.doctype ? this.doctypeToString(documentObject.doctype) : this.defaultDoctype
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId ? ` PUBLIC "${doctype.publicId}" ` : ''
    const systemDeclaration = doctype.systemId ? ` SYSTEM "${doctype.systemId}" ` : ''

    return `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>'
  }

  private serializeInputElements(domClone: HTMLElement): HTMLElement {
    const inputNodes = domClone.getElementsByTagName('input')
    const inputElements = Array.prototype.slice.call(inputNodes) as HTMLInputElement[]

    inputElements.forEach((elem: HTMLInputElement) => {
      switch (elem.type) {
      case 'checkbox':
      case 'radio':
        if (elem.checked) {
          elem.setAttribute('checked', '')
        }
        break
      default:
        elem.setAttribute('value', elem.value)
      }
    })

    return domClone
  }

  private stabilizeDOM(dom: HTMLElement) {
    const stabilizedDOM = this.serializeInputElements(dom)
    // more calls to come here

    return stabilizedDOM
  }
}
