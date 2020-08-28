export interface DOMOptions {
  enableJavaScript?: boolean,
  domTransformation?: (dom: HTMLDocument) => void
}

const FORM_ELEMENTS_SELECTOR = 'input, textarea, select'

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
        console.error('Could not transform the dom: ', error.toString())
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
   * serialize (mutate) into the cloned DOM. Never mutate the original DOM.
   *
   */
  private stabilizeDOM(clonedDOM: HTMLDocument): HTMLElement {
    this.serializeInputElements(clonedDOM)
    this.serializeFrameElements(clonedDOM)

    // We only want to serialize the CSSOM or canvas if JS isn't enabled.
    if (!this.options.enableJavaScript) {
      this.serializeCSSOM(clonedDOM)
      this.serializeCanvasElements(clonedDOM)
    }

    return clonedDOM.documentElement
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
  private serializeInputElements(clonedDOM: HTMLDocument): void {
    const formNodes = this.originalDOM.querySelectorAll(FORM_ELEMENTS_SELECTOR)
    const formElements = Array.from(formNodes) as HTMLFormElement[]

    formElements.forEach((elem) => {
      const inputId = elem.getAttribute('data-percy-element-id')
      const selector = `[data-percy-element-id="${inputId}"]`
      const cloneEl = clonedDOM.querySelector(selector) as any

      switch (elem.type) {
        case 'checkbox':
        case 'radio':
          if (elem.checked) {
            cloneEl!.setAttribute('checked', '')
          }
          break
        case 'select-one':
          if (elem.selectedIndex !== -1) {
            cloneEl.options[elem.selectedIndex].setAttribute('selected', 'true')
          }
          break
        case 'select-multiple':
          const selectedOptions = Array.from(elem.selectedOptions)
          const clonedOptions = Array.from(cloneEl.options)

          if (selectedOptions.length) {
            selectedOptions.forEach((option: any) => {
              const matchingOption = clonedOptions
                .find((cloneOption: any) => option.text === cloneOption.text) as HTMLOptionElement
              matchingOption.setAttribute('selected', 'true')
            })
          }

          break
        case 'textarea':
          // setting text or value does not work but innerHTML does
          cloneEl!.innerHTML = elem.value
          break
        default:
          cloneEl!.setAttribute('value', elem.value)
      }
    })
  }

  private serializeFrameElements(clonedDOM: HTMLDocument) {
    const { enableJavaScript } = this.options

    for (const frame of this.originalDOM.querySelectorAll('iframe')) {
      const percyElementId = frame.getAttribute('data-percy-element-id')
      const cloned = clonedDOM.querySelector(`[data-percy-element-id="${percyElementId}"]`)
      const builtWithJs = !frame.srcdoc && (!frame.src || frame.src.split(':')[0] === 'javascript')

      // delete frames within the head since they usually break pages when
      // rerendered and do not effect the visuals of a page
      if (clonedDOM.head.contains(cloned)) {
        cloned!.remove()
      // if the frame document is accessible, we can serialize it
      } else if (frame.contentDocument) {
        // js is enabled and this frame was built with js, don't serialize it
        if (enableJavaScript && builtWithJs) { continue }
        // the frame has yet to load and wasn't built with js, it is unsafe to serialize
        if (!builtWithJs && !frame.contentWindow!.performance.timing.loadEventEnd) { continue }

        // recersively serialize contents and assign to srcdoc
        const frameDOM = new DOM(frame.contentDocument, this.options)
        cloned!.setAttribute('srcdoc', frameDOM.snapshotString())
        // srcdoc cannot exist in tandem with src
        cloned!.removeAttribute('src')

      // delete inaccessible frames built with js when js is disabled because
      // they break asset discovery by creating non-captured requests that hang
      } else if (!enableJavaScript && builtWithJs) {
        cloned!.remove()
      }

      // Remove any lazy loading attributes, since they hang asset discovery
      cloned!.removeAttribute('loading')
    }
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
    const styleSheets = Array.from(this.originalDOM.styleSheets) as CSSStyleSheet[]

    styleSheets.forEach((styleSheet) => {
      // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
      // and isn't already in the DOM.
      function isCSSOM() {
        const hasHref = styleSheet.href
        const ownerNode = styleSheet.ownerNode as HTMLElement
        const ownerNodeInnerContent = ownerNode.innerText && ownerNode.innerText.trim()
        const hasStyleInDom = !!ownerNodeInnerContent && ownerNodeInnerContent.length > 0

        return !hasHref && !hasStyleInDom && styleSheet.cssRules
      }

      if (isCSSOM()) {
        const $style = documentClone.createElement('style')
        const cssRules = Array.from(styleSheet.cssRules) as CSSRule[]
        const serializedStyles = cssRules.reduce((prev: string, cssRule) => {
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
  }

  /**
   * Capture in-memory canvas elements & serialize them to images into the
   * cloned DOM.
   *
   * Without this, applications that have canvas elements will be missing and
   * appear broken. The Canvas DOM API allows you to covert them to images, which
   * is what we're doing here to capture that in-memory state & serialize it
   * into the DOM Percy captures.
   *
   * It's important to note the `.toDataURL` API requires WebGL canvas elements
   * to use `preserveDrawingBuffer: true`. This is because `.toDataURL` captures
   * from the drawing buffer, which is cleared after each render by default for
   * performance.
   *
   */
  private serializeCanvasElements(clonedDOM: HTMLDocument): void {
    for (const $canvas of this.originalDOM.querySelectorAll('canvas')) {
      const $image = clonedDOM.createElement('img')
      const canvasId = $canvas.getAttribute('data-percy-element-id')
      const $clonedCanvas = clonedDOM.querySelector(`[data-percy-element-id=${canvasId}]`) as any

      $image.setAttribute('style', 'max-width: 100%')
      $image.classList.add('percy-canvas-image')

      $image.src = $canvas.toDataURL()
      $image.setAttribute('data-percy-canvas-serialized', 'true')
      $clonedCanvas.parentElement.insertBefore($image, $clonedCanvas)
      $clonedCanvas.remove()
    }
  }
  /**
   * A single place to mutate the original DOM. This should be the last resort!
   * This will change the customer's DOM and have a possible impact on the
   * customer's application.
   *
   */
  private mutateOriginalDOM() {
    const createUID = () => `_${Math.random().toString(36).substr(2, 9)}`
    const formNodes = this.originalDOM.querySelectorAll(FORM_ELEMENTS_SELECTOR)
    const frameNodes = this.originalDOM.querySelectorAll('iframe')
    const canvasNodes = this.originalDOM.querySelectorAll('canvas')
    const elements = [...formNodes, ...frameNodes, ...canvasNodes] as HTMLElement[]

    // loop through each element and apply an ID for serialization later
    elements.forEach((elem) => {
      if (!elem.getAttribute('data-percy-element-id')) {
        elem.setAttribute('data-percy-element-id', createUID())
      }
    })
  }
}

export default DOM
