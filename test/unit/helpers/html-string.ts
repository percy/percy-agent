/**
 * Returns the HTML of the given Document as a string, with the HTML corresponding to
 * the given selector removed. Does all this without modifying the actual Document.
 */
export function htmlWithoutSelector(doc: Document, selector: string): string {
  const fullHTML = document.documentElement.outerHTML
  const selectedElement = document.querySelector(selector)
  if (selectedElement === null) {
    throw new Error(`Could not find ${selector} in document.`)
  }

  const selectorHTML = selectedElement.outerHTML
  return fullHTML.replace(selectorHTML, '')
}
