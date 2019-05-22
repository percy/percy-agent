class DOM {
  originalDOM: any;
  clonedDOM: any;
  options: any;

  readonly defaultDoctype = "<!DOCTYPE html>";

  constructor(dom: any, options: object) {
    // it would be pretty dope if we validated the DOM before cloning.
    // thay way we could provide a nice error or warning for future
    // possible issues they might see in snapshots
    this.originalDOM = dom;
    this.options = options || {};
    this.clonedDOM = this.cloneDOM();
  }

  snapshotString(): string {
    let dom = this.clonedDOM;
    let doctype = this.getDoctype();

    // Sometimes you'll want to transform the DOM provided into one ready for snapshotting
    // For example, if your test suite runs tests in an element inside a page that
    // lists all yours tests. You'll want to "hoist" the contents of the testing container to be
    // the full page. Using a dom transformation is how you'd acheive that.
    if (this.options.domTransformation) {
      dom = this.options.domTransformation(dom);
    }

    const snapshotString = doctype + dom.outerHTML;

    return snapshotString;
  }

  private getDoctype(): string {
    return this.clonedDOM.doctype
      ? this.doctypeToString(this.clonedDOM.doctype)
      : this.defaultDoctype;
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId
      ? ` PUBLIC "${doctype.publicId}" `
      : "";
    const systemDeclaration = doctype.systemId
      ? ` SYSTEM "${doctype.systemId}" `
      : "";

    return (
      `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + ">"
    );
  }

  /**
   * Takes the raw DOM from the snapshot, performs necessary transformations,
   * and finally returns a deep clone of the DOM.
   *
   */
  private cloneDOM(): HTMLDocument {
    this.mutateOriginalDOM();
    let clone = this.originalDOM.cloneNode(true);
    clone = this.stabilizeDOM(clone);

    return clone;
  }

  /**
   * Serialize parts of the DOM that aren't preserved in a deep clone. Anything
   * that is not encoded in the DOM tree needs to be accounted for here (CSSOM,
   * input values, canvas, etc).
   *
   */
  private stabilizeDOM(clonedDOM: any): HTMLElement {
    let stabilizedDOMClone;
    stabilizedDOMClone = this.serializeInputElements(clonedDOM);

    // We only want to serialize the CSSOM if JS isn't enabled.
    if (!this.options.enableJavaScript || !this.options.enableJavascript) {
      stabilizedDOMClone = this.serializeCssOm(clonedDOM);
    }

    return stabilizedDOMClone.documentElement;
  }

  serializeInputElements(clonedDOM: HTMLDocument): HTMLDocument {
    let formNodes = this.originalDOM.querySelectorAll("input, textarea");
    let formElements = Array.from(formNodes);

    formElements.forEach((elem: any) => {
      const inputId = elem.attributes["data-percy-element-id"].value;
      const selector = `[data-percy-element-id="${inputId}"]`;
      const cloneEl = clonedDOM.querySelector(selector) as HTMLInputElement;

      switch (elem.type) {
        case "checkbox":
        case "radio":
          if (elem.checked && !elem.hasAttribute("checked")) {
            cloneEl!.setAttribute("checked", "");
          }
          break;
        case "textarea":
          // setting text or value does not work but innerText does
          if (elem.innerText !== elem.value) {
            cloneEl!.innerText = elem.value;
          }
        default:
          if (!elem.getAttribute("value")) {
            cloneEl!.setAttribute("value", elem.value);
          }
      }
    });

    return clonedDOM;
  }

  serializeCssOm(documentClone: any) {
    let styleSheets = Array.from(this.originalDOM.styleSheets);

    // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
    // and isn't already in the DOM.
    function isCSSOM(styleSheet: any) {
      let hasHref = styleSheet.href;
      let hasCSSRules = styleSheet.cssRules;
      let ownerNode = styleSheet.ownerNode as HTMLElement;
      let hasStyleInDom = ownerNode.innerText && ownerNode.innerText.length > 0;

      return !hasHref && !hasStyleInDom && hasCSSRules;
    }

    styleSheets.forEach((styleSheet: any) => {
      if (isCSSOM(styleSheet)) {
        let $style = documentClone.createElement("style");
        let cssRules = Array.from(styleSheet.cssRules);
        let serializedStyles = cssRules.reduce((prev: string, cssRule: any) => {
          return prev + cssRule.cssText;
        }, "");

        // Append the serialized styles to the cloned document
        $style.type = "text/css";
        $style.setAttribute("data-percy-cssom-serialized", "true");
        $style.innerHTML = serializedStyles;
        // TODO, it'd be better if we appended it right after the ownerNode in the clone
        documentClone.head.appendChild($style);
      }
    });

    return documentClone;
  }

  // one place to mutate the orignal DOM. This should not be done unless
  // there's a good reason
  private mutateOriginalDOM() {
    function createUID($el: Element) {
      const ID =
        "_" +
        Math.random()
          .toString(36)
          .substr(2, 9);

      $el.setAttribute("data-percy-element-id", ID);
    }

    const formNodes = this.originalDOM.querySelectorAll("input, textarea");
    const formElements = Array.from(formNodes);
    // loop through each for element and apply an ID for serialization later
    formElements.forEach((elem: any) => createUID(elem));
  }
}

export default DOM;
