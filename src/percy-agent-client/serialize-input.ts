export function serializeInputElements(originalDocument: HTMLDocument, documentClone: HTMLDocument): HTMLDocument {
  const formNodes = originalDocument.querySelectorAll('input, textarea')
  const formElements = Array.prototype.slice.call(formNodes)

  formElements.forEach((elem: HTMLInputElement) => {
    const inputId = elem.attributes['data-percy-element-id'].value
    const selector = `[data-percy-element-id="${inputId}"]`
    const cloneEl = documentClone.querySelector(selector) as HTMLInputElement

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

  return documentClone
}
