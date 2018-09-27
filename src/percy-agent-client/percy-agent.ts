import {PercyAgentClient} from './percy-agent-client'
import {SnapshotOptions} from './snapshot-options'
import {ClientOptions} from './client-options'

export default class PercyAgent {
  clientInfo: string | null
  environmentInfo: string | null
  xhr: any
  port: number
  domTransformation: any | null
  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(options: ClientOptions = {}) {
    this.clientInfo = options.clientInfo || null
    this.environmentInfo = options.environmentInfo || null
    this.xhr = options.xhr || XMLHttpRequest
    this.domTransformation = options.domTransformation || null
    this.port = options.port || 5338
  }

  snapshot(name: string, options: SnapshotOptions = {}) {
    let documentObject = options.document || document
    let domSnapshot = this.domSnapshot(documentObject)
    let percyAgentClient = new PercyAgentClient(this.xhr)

    percyAgentClient.post(`http://localhost:${this.port}/percy/snapshot`, {
      name,
      url: documentObject.URL,
      enableJavascript: options.enableJavascript,
      widths: options.widths,
      clientInfo: this.clientInfo,
      environmentInfo: this.environmentInfo,
      domSnapshot
    })
  }

  private domSnapshot(documentObject: Document): string {
    let doctype = this.getDoctype(documentObject)
    let dom = this.stabalizeDOM(documentObject.documentElement as HTMLElement)
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
    let inputElements = Array.prototype.slice.call(inputNodes) as HTMLInputElement[]

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

  private stabalizeDOM(dom: HTMLElement) {
    let stabilizedDOM = this.serializeInputElements(dom)
    // more calls to come here

    return stabilizedDOM
  }
}
