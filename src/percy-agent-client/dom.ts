export interface DOMOptions {
  enableJavaScript?: boolean,
  domTransformation?: (dom: HTMLDocument) => void
}

/**
 * A single class to encapsulate all DOM operations that need to be performed to
 * capture the customer's application state.
 *
 */
class DOM {
  originalDOM: HTMLDocument
  clonedDOM: HTMLDocument
  options: DOMOptions

  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(dom: HTMLDocument, options?: DOMOptions) {
    this.originalDOM = dom
    this.options = options || {}
    this.clonedDOM = this.cloneDOM()
  }

  /**
   * Returns the final DOM string with all of the necessary transforms
   * applied. This is the string that is passed to the API and then rendered by
   * our API.
   *
   */
  snapshotString(): string {
    // any since the cloned DOMs type can shift
    let dom = this.clonedDOM as any
    const doctype = this.getDoctype()

    // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
    // For example, if your test suite runs tests in an element inside a page that
    // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
    // the full page. Using a dom transformation is how you'd achieve that.
    if (this.options.domTransformation) {
      try {
        dom = this.options.domTransformation(dom)
      } catch (error) {
        console.error('Could not transform the dom: ', error)
      }
    }

    return doctype + dom.outerHTML
  }

  private getDoctype(): string {
    return this.clonedDOM.doctype
      ? this.doctypeToString(this.clonedDOM.doctype)
      : this.defaultDoctype
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId
      ? ` PUBLIC "${doctype.publicId}" `
      : ''
    const systemDeclaration = doctype.systemId
      ? ` SYSTEM "${doctype.systemId}" `
      : ''

    return (
      `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>'
    )
  }

  /**
   * Takes the raw DOM from the snapshot, performs necessary mutations,
   * and finally returns a deep clone of the original DOM.
   *
   */
  private cloneDOM(): HTMLDocument {
    this.mutateOriginalDOM()
    // Any because its type changes when given to `stabilizeDOM`
    let clone = this.originalDOM.cloneNode(true) as any
    clone = this.stabilizeDOM(clone)

    return clone
  }

  /**
   * Serialize parts of the DOM that aren't preserved in a deep clone. Anything
   * that is not encoded in the DOM tree needs to be accounted for here (CSSOM,
   * input values, canvas, etc).
   *
   * This method should always capture these values from the original DOM and
   * serialize into the cloned DOM. Never mutate the original DOM.
   *
   */
  private stabilizeDOM(clonedDOM: HTMLDocument): HTMLElement {
    let stabilizedDOMClone = this.serializeInputElements(clonedDOM)

    // We only want to serialize the CSSOM if JS isn't enabled.
    if (!this.options.enableJavaScript) {
      stabilizedDOMClone = this.serializeCSSOM(stabilizedDOMClone)
    }

    return stabilizedDOMClone.documentElement
  }

  /**
   * Capture in-memory form element values and serialize those values to their
   * respective elements in the cloned DOM.
   *
   * Form element values for non-controlled elements won't be captured with a
   * domClone. To fix this, we explicitly set the `value` attribute on those
   * form controls to make sure they persist in snapshots.
   *
   */
  private serializeInputElements(clonedDOM: HTMLDocument): HTMLDocument {
    const formNodes = this.originalDOM.querySelectorAll('input, textarea')
    const formElements = Array.from(formNodes)

    formElements.forEach((elem: any) => {
      const inputId = elem.attributes['data-percy-element-id'].value
      const selector = `[data-percy-element-id="${inputId}"]`
      const cloneEl = clonedDOM.querySelector(selector) as HTMLInputElement

      switch (elem.type) {
        case 'checkbox':
        case 'radio':
          if (elem.checked && !elem.hasAttribute('checked')) {
            cloneEl!.setAttribute('checked', '')
          }
          break
        case 'textarea':
          // setting text or value does not work but innerText does
          if (elem.innerText !== elem.value) {
            cloneEl!.innerText = elem.value
          }
        default:
          if (!elem.getAttribute('value')) {
            cloneEl!.setAttribute('value', elem.value)
          }
      }
    })

    return clonedDOM
  }

  /**
   * Capture in-memory styles & serialize those styles into the cloned DOM.
   *
   * Without this, applications that use packages like `styled-components` will be
   * missing styles and appear broken. The CSSOM provides a way to create CSS
   * that only lives in memory (not an asset or in the DOM).
   *
   */
  private serializeCSSOM(documentClone: HTMLDocument) {
    const styleSheets = Array.from(this.originalDOM.styleSheets)

    styleSheets.forEach((styleSheet: any) => {
      // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
      // and isn't already in the DOM.
      function isCSSOM() {
        const hasHref = styleSheet.href
        const ownerNode = styleSheet.ownerNode as HTMLElement
        const hasStyleInDom =
          ownerNode.innerText && ownerNode.innerText.length > 0

        return !hasHref && !hasStyleInDom && styleSheet.cssRules
      }

      if (isCSSOM()) {
        const $style = documentClone.createElement('style')
        const cssRules = Array.from(styleSheet.cssRules)
        const serializedStyles = cssRules.reduce((prev: string, cssRule: any) => {
          return prev + cssRule.cssText
        }, '')

        // Append the serialized styles to the cloned document
        $style.type = 'text/css'
        $style.setAttribute('data-percy-cssom-serialized', 'true')
        $style.innerHTML = serializedStyles
        // TODO, it'd be better if we appended it right after the ownerNode in the clone
        documentClone.head.appendChild($style)
      }
    })

    return documentClone
  }

  /**
   * A single place to mutate the original DOM. This should be the last resort!
   * This will change the customer's DOM and have a possible impact on the
   * customer's application.
   *
   */
  private mutateOriginalDOM() {
    function createUID($el: Element) {
      const ID =
        '_' +
        Math.random()
          .toString(36)
          .substr(2, 9)

      $el.setAttribute('data-percy-element-id', ID)
    }

    const formNodes = this.originalDOM.querySelectorAll('input, textarea')
    const formElements = Array.from(formNodes)
    // loop through each form element and apply an ID for serialization later
    formElements.forEach((elem: any) => {
      if (!elem.attributes['data-percy-element-id']) {
        createUID(elem)
      }
    })
  }
}

export default DOM
