const DATA_ATTRIBUTE = 'data-percy-cssom-serialized'
const START_COMMENT = '/* Start of Percy serialized CSSOM */'

// Take all the CSS created in the CSS Object Model (CSSOM), and inject it
// into the DOM so Percy can render it safely in our browsers.
// Design doc:
// https://docs.google.com/document/d/1Rmm8osD-HwSHRpb8pQ_1wLU09XeaCV5AqMtQihk_BmM/edit
export function serializeCssOm(document: HTMLDocument) {
  [].slice.call(document.styleSheets).forEach((styleSheet: CSSStyleSheet) => {
    // Make sure it has a rulesheet, does NOT have a href (no external stylesheets),
    // and isn't already in the DOM.
    const hasHref = styleSheet.href
    const ownerNode = styleSheet.ownerNode as HTMLElement
    const hasStyleInDom = ownerNode.innerText && ownerNode.innerText.length > 0

    if (!hasHref && !hasStyleInDom && styleSheet.cssRules) {
      const serializedStyles = [].slice
        .call(styleSheet.cssRules)
        .reduce((prev: string, cssRule: CSSRule) => {
          return prev + cssRule.cssText
        }, `${START_COMMENT}\n`)

      // Append the serialized styles to the styleSheet's ownerNode to minimize
      // the chances of messing up the cascade order.
      ownerNode.setAttribute(DATA_ATTRIBUTE, 'true')
      ownerNode.appendChild(document.createTextNode(serializedStyles))
    }
  })

  return document
}

export function cleanSerializedCssOm(document: HTMLDocument) {
  // IMPORTANT: querySelectorAll(...) will not always work. In particular, in certain
  // cases with malformed HTML (e.g. a <style> tag inside of another one), some of
  // the elements we are looking for will not be returned. In that case, we will
  // leave traces of ourselves in the underlying DOM.
  const nodes = document.querySelectorAll(`[${DATA_ATTRIBUTE}]`)
  Array.from(nodes).forEach((node: Element) => {
    node.removeAttribute(DATA_ATTRIBUTE)
    const startOfSerialized = node.innerHTML.indexOf(START_COMMENT)
    if (startOfSerialized < 0) {
      return
    }
    node.innerHTML = node.innerHTML.substring(0, startOfSerialized)
  })
}
