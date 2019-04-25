const DATA_ATTRIBUTE_VALUE = 'data-percy-input-serialized-value'

export function serializeInputElements(doc: HTMLDocument): HTMLDocument {
  const domClone = doc.documentElement
  const formElements = domClone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')

  formElements.forEach((el) => {
    if (isTextAreaElement(el)) {
      serializeTextAreaElement(el)
      return
    }

    if (isCheckableElement(el)) {
      serializeCheckableInputElement(el)
      return
    }

    serializeValueInputElement(el)
  })

  return doc
}

export function cleanSerializedInputElements(doc: HTMLDocument): void {
  const formElements = doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')

  formElements.forEach((el) => {
    if (isTextAreaElement(el)) {
      cleanSerializedTextAreaElement(el)
      return
    }

    if (isCheckableElement(el)) {
      cleanSerializedCheckableInputElement(el)
      return
    }

    cleanSerializedValueInputElement(el)
  })
}

function serializeCheckableInputElement(el: HTMLInputElement): void {
  const checkedAttribute = el.getAttribute('checked')
  const checked = el.checked

  if (checkedAttribute !== null) {
    el.setAttribute(DATA_ATTRIBUTE_VALUE, checkedAttribute)
  }

  setCheckedAttribute(el, checked)
}

function serializeTextAreaElement(el: HTMLTextAreaElement): void {
  el.setAttribute(DATA_ATTRIBUTE_VALUE, el.defaultValue)
  el.innerText = el.value
}

function serializeValueInputElement(el: HTMLInputElement): void {
  const valueAttribute = el.getAttribute('value')
  const value = el.value || ''

  if (valueAttribute !== null) {
    el.setAttribute(DATA_ATTRIBUTE_VALUE, valueAttribute)
  }

  if (value !== valueAttribute) {
    el.setAttribute('value', value)
  }
}

function cleanSerializedTextAreaElement(el: HTMLTextAreaElement): void {
  const originalValue = el.getAttribute(DATA_ATTRIBUTE_VALUE) || ''
  el.innerText = originalValue
  el.value = originalValue

  el.removeAttribute(DATA_ATTRIBUTE_VALUE)
}

function cleanSerializedCheckableInputElement(el: HTMLInputElement): void {
  cleanPercyValueAttribute(el, 'checked', DATA_ATTRIBUTE_VALUE)
}

function cleanSerializedValueInputElement(el: HTMLInputElement): void {
  cleanPercyValueAttribute(el, 'value', DATA_ATTRIBUTE_VALUE)
}

function cleanPercyValueAttribute(
  el: HTMLInputElement,
  attributeName: 'checked' | 'value',
  originalAttributeValue: string,
): void {
  const originalValue = el.getAttribute(originalAttributeValue)

  el.removeAttribute(originalAttributeValue)

  if (attributeName === 'value') {
    el.value = originalValue !== null ? originalValue as string : ''
  }

  if (attributeName === 'checked') {
    el.checked = originalValue !== null
  }

  if (originalValue !== null) {
    el.setAttribute(attributeName, `${originalValue}`)
    return
  }

  el.removeAttribute(attributeName)
}

function setCheckedAttribute(el: HTMLInputElement, checked: boolean): void {
  if (checked) {
    el.setAttribute('checked', 'checked')
    return
  }

  el.removeAttribute('checked')
}

function isTextAreaElement(el: HTMLElement): el is HTMLTextAreaElement {
  return el.tagName.toLowerCase() === 'textarea'
}

function isCheckableElement(el: HTMLInputElement): boolean {
  return el.type === 'radio' || el.type === 'checkbox'
}
