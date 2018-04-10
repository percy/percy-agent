interface Request {
   /**
    * URL of the request.
    * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry/name
    */
  name: string
}

class RequestManifest {
  /**
   * Capture a list of URLs for resources requested by this page.
   */
  capture(): string[] {
    let requests: Request[] = performance.getEntriesByType('resource')
    return requests.map(request => request.name)
  }
}

interface SnapshotOptions {
  enableJavascript?: boolean,
  widths?: number[],
  minimumHeight?: number,
}

class Percy {
  clientUserAgent: string | null
  beforeSnapshot: any
  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(clientUserAgent?: string, beforeSnapshot?: any) {
    this.clientUserAgent = clientUserAgent || null
    this.beforeSnapshot = beforeSnapshot || null
  }

  snapshot(name: string, options: SnapshotOptions) {
    if (this.beforeSnapshot) { this.beforeSnapshot() }
    this.stabalizePage()

    let requestManifest = new RequestManifest()

    console.log(
      'TAKING SNAPSHOT\n' +
      `name: ${name}\n` +
      `enableJavascript: ${options.enableJavascript}.\n` +
      `widths: ${options.widths}.\n` +
      `clientUserAgent: ${this.clientUserAgent}.\n` +
      `requestManifest: ${requestManifest.capture()}\n` +
      `domSnapshot: ${this.domSnapshot()}`
    )
  }

  private domSnapshot(): string {
    let doctype = this.getDoctype()
    let dom = document.documentElement.outerHTML

    return doctype + dom
  }

  private getDoctype(): string {
    return document.doctype.name ? this.doctypeToString(document.doctype) : this.defaultDoctype
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId ? ` PUBLIC "${doctype.publicId}" ` : ''
    const systemDeclaration = doctype.systemId ? ` SYSTEM "${doctype.systemId}" ` : ''

    return `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>'
  }

  private stabalizePage() {
    // Apply various hacks to the pages
    // freeze jQuery etc.
  }
}
