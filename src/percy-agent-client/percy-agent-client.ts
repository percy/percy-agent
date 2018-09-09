interface Request {
  name: string
}

class RequestManifest {
  capture(): string[] {
    let requests: Request[] = performance.getEntriesByType('resource')
    return requests.map(request => request.name)
  }
}

class PercyAgent {
  xhr: XMLHttpRequest

  constructor(xhr?: any) {
    this.xhr = new xhr() || new XMLHttpRequest()
  }

  post(url: string, data: any) {
    this.xhr.open('post', url, false) // synchronous request
    this.xhr.setRequestHeader('Content-Type', 'application/json')
    this.xhr.send(JSON.stringify(data))
  }
}

export interface SnapshotOptions {
  enableJavascript?: boolean,
  widths?: number[],
  minimumHeight?: number,
}

export class PercyAgentClient {
  userAgent: string | null
  xhr: any
  domTransformation: any | null
  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(userAgent?: string, xhr?: any, domTransformation?: any) {
    this.userAgent = userAgent || null
    this.xhr = xhr || XMLHttpRequest
    this.domTransformation = domTransformation || null
  }

  snapshot(name: string, options: SnapshotOptions = {}) {
    let requestManifest = new RequestManifest().capture()
    let domSnapshot = this.domSnapshot()
    let percyAgent = new PercyAgent(this.xhr)

    // TODO: this cannot be hardcoded to this port
    percyAgent.post('http://localhost:5338/percy/snapshot', {
      name,
      url: document.URL,
      enableJavascript: options.enableJavascript,
      widths: options.widths,
      clientUserAgent: this.userAgent,
      requestManifest,
      domSnapshot
    })
  }

  private domSnapshot(): string {
    let doctype = this.getDoctype()
    let dom = this.stabalizeDOM(document.documentElement)
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

  private getDoctype(): string {
    return document.doctype ? this.doctypeToString(document.doctype) : this.defaultDoctype
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
