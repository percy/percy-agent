const DATA_ATTRIBUTE = 'data-percy-cssom-serialized'

// Take all the CSS created in the CSS Object Model (CSSOM), and inject it
// into the DOM so Percy can render it safely in our browsers.
// Design doc:
// https://docs.google.com/document/d/1Rmm8osD-HwSHRpb8pQ_1wLU09XeaCV5AqMtQihk_BmM/edit
export function serializeCssOm(originalDocument: HTMLDocument, documentClone: HTMLDocument) {
  [].slice.call(originalDocument.styleSheets).forEach((styleSheet: CSSStyleSheet) => {
    // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
    // and isn't already in the DOM.
    const hasHref = styleSheet.href
    const ownerNode = styleSheet.ownerNode as HTMLElement
    const hasStyleInDom = ownerNode.innerText && ownerNode.innerText.length > 0
    const $style = documentClone.createElement('style')

    if (!hasHref && !hasStyleInDom && styleSheet.cssRules) {
      const serializedStyles = [].slice
        .call(styleSheet.cssRules)
        .reduce((prev: string, cssRule: CSSRule) => {
          return prev + cssRule.cssText
        }, '')

      // Append the serialized styles to the cloned document
      $style.type = 'text/css'
      $style.setAttribute(DATA_ATTRIBUTE, 'true')
      $style.innerHTML = serializedStyles
      documentClone.head.appendChild($style)
    }
  })

  return documentClone
}
