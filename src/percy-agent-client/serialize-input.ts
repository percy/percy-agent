const DATA_ATTRIBUTE_CHECKED = 'data-percy-input-serialized-checked'
const DATA_ATTRIBUTE_TEXTAREA_INNERTEXT = 'data-percy-input-serialized-textarea-innertext'
const DATA_ATTRIBUTE_VALUE = 'data-percy-input-serialized-value'

export function serializeInputElements(doc: HTMLDocument): HTMLDocument {
  const domClone = doc.documentElement
  const formNodes = domClone.querySelectorAll('input, textarea')
  const formElements = Array.prototype.slice.call(formNodes)

  formElements.forEach((elem: HTMLInputElement) => {
    switch (elem.type) {
    case 'checkbox':
    case 'radio':
      if (elem.checked && !elem.hasAttribute('checked')) {
        elem.setAttribute('checked', '')
        elem.setAttribute(DATA_ATTRIBUTE_CHECKED, '')
      }
      break
    case 'textarea':
      // setting text or value does not work but innerText does
      if (elem.innerText !== elem.value) {
        elem.setAttribute(DATA_ATTRIBUTE_TEXTAREA_INNERTEXT, elem.innerText)
        elem.innerText = elem.value
      }
    default:
      if (!elem.getAttribute('value')) {
        elem.setAttribute(DATA_ATTRIBUTE_VALUE, '')
        elem.setAttribute('value', elem.value)
      }
    }
  })

  return doc
}

export function cleanSerializedInputElements(doc: HTMLDocument) {
  doc.querySelectorAll(`[${DATA_ATTRIBUTE_CHECKED}]`).forEach((el: Element) => {
    el.removeAttribute('checked')
    el.removeAttribute(DATA_ATTRIBUTE_CHECKED)
  })
  doc.querySelectorAll(`[${DATA_ATTRIBUTE_TEXTAREA_INNERTEXT}]`).forEach((el: Element)  => {
    const originalInnerText: string = el.getAttribute(DATA_ATTRIBUTE_TEXTAREA_INNERTEXT) || ''
    const textArea = el as HTMLTextAreaElement
    textArea.innerText = originalInnerText
    el.removeAttribute(DATA_ATTRIBUTE_TEXTAREA_INNERTEXT)
  })
  doc.querySelectorAll(`[${DATA_ATTRIBUTE_VALUE}]`).forEach((el: Element) => {
    el.removeAttribute('value')
    el.removeAttribute(DATA_ATTRIBUTE_VALUE)
  })
}
