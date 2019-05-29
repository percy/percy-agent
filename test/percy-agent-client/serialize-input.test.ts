import {expect} from 'chai'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import fixture from './fixtures/dom.html'

const attr = 'data-percy-input-serialized-value'

describe('serializeInputElements', () => {
  before(() => {
    document.body.innerHTML = fixture
  })

  after(() => {
    document.body.innerHTML = ''
  })

  const subject: PercyAgent = new PercyAgent({ handleAgentCommunication: false })

  describe('serializes text input elements', () => {
    describe('no value', () => {
      it('no changes', () => {
        const [input, snapshot] = createInputSnapshot('testInput')
        expect(snapshot).to.contain('<input id="testInput" value="">')
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createInputSnapshot('testInput', 'new value')
        expect(snapshot).to.contain('<input id="testInput" value="new value">')
        testInputIsCleaned(input, 'new value')
      })

      function testInputIsCleaned(input: HTMLInputElement, value: string = '') {
        expect(input.hasAttribute('value')).to.equal(false)
        expect(input.value).to.equal(value)
      }
    })

    describe('with value', () => {
      it('no changes', () => {
        const [input, snapshot] = createInputSnapshot('testInputValue')
        expect(snapshot).to.contain(
          `<input id="testInputValue" value="default value" ${attr}="default value">`,
        )
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createInputSnapshot('testInputValue', 'new value')
        expect(snapshot).to.contain(
          `<input id="testInputValue" value="new value" ${attr}="default value">`,
        )
        testInputIsCleaned(input)
      })

      function testInputIsCleaned(input: HTMLInputElement) {
        expect(input.hasAttribute('value')).to.equal(true)
        expect(input.getAttribute('value')).to.equal('default value')
        expect(input.value).to.equal('default value')
      }
    })

    function createInputSnapshot(id: string, value?: string): [HTMLInputElement, string] {
      const input = document.getElementById(id) as HTMLInputElement

      if (value !== undefined) {
        input.value = value
      }

      const snapshot = subject.snapshot('test snapshot')
      return [input, snapshot]
    }
  })

  describe('serializes checkbox input elements', () => {
    describe('no checked', () => {
      it('no changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testCheckbox')
        expect(snapshot).to.contain('<input id="testCheckbox" type="checkbox">')
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testCheckbox', true)
        expect(snapshot).to.contain('<input id="testCheckbox" type="checkbox" checked="checked">')
        testInputIsCleaned(input, true)
      })

      function testInputIsCleaned(input: HTMLInputElement, value: boolean = false) {
        expect(input.hasAttribute('checked')).to.equal(false)
        expect(input.checked).to.equal(value)
      }
    })

    describe('with checked="checked"', () => {
      it('no changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testCheckboxChecked')
        expect(snapshot).to.contain(
          `<input id="testCheckboxChecked" type="checkbox" checked="checked" ${attr}="checked">`,
        )
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testCheckboxChecked', false)
        expect(snapshot).to.contain(
          `<input id="testCheckboxChecked" type="checkbox" ${attr}="checked">`,
        )
        testInputIsCleaned(input)
      })

      function testInputIsCleaned(input: HTMLInputElement) {
        expect(input.hasAttribute('checked')).to.equal(true)
        expect(input.getAttribute('checked')).to.equal('checked')
        expect(input.checked).to.equal(true)
      }
    })
  })

  describe('serializes radio input elements', () => {
    describe('no checked', () => {
      it('no changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testRadio')
        expect(snapshot).to.contain('<input id="testRadio" type="radio">')
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testRadio', true)
        expect(snapshot).to.contain('<input id="testRadio" type="radio" checked="checked">')
        testInputIsCleaned(input, true)
      })

      function testInputIsCleaned(input: HTMLInputElement, value: boolean = false) {
        expect(input.hasAttribute('checked')).to.equal(false)
        expect(input.checked).to.equal(value)
      }
    })

    describe('with checked', () => {
      it('no changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testRadioChecked')
        expect(snapshot).to.contain(
          `<input id="testRadioChecked" type="radio" checked="checked" ${attr}="">`,
        )
        testInputIsCleaned(input)
      })

      it('reverts changes', () => {
        const [input, snapshot] = createCheckedInputSnapshot('testRadioChecked', false)
        expect(snapshot).to.contain(`<input id="testRadioChecked" type="radio" ${attr}="">`)
        testInputIsCleaned(input)
      })

      function testInputIsCleaned(input: HTMLInputElement) {
        expect(input.hasAttribute('checked')).to.equal(true)
        expect(input.getAttribute('checked')).to.equal('')
        expect(input.checked).to.equal(true)
      }
    })
  })

  describe('serializes textarea elements', () => {
    describe('no value', () => {
      it('no changes', () => {
        const [textarea, snapshot] = createTextAreaSnapshot('testTextarea')
        expect(snapshot).to.contain(`<textarea id="testTextarea" ${attr}=""></textarea>`)
        testTextAreaIsCleaned(textarea, '')
      })

      it('reverts changes', () => {
        const [textarea, snapshot] = createTextAreaSnapshot('testTextarea', 'new value')
        expect(snapshot).to.contain(`<textarea id="testTextarea" ${attr}="">new value</textarea>`)
        testTextAreaIsCleaned(textarea, '')
      })
    })

    describe('with value', () => {
      it('no changes', () => {
        const [textarea, snapshot] = createTextAreaSnapshot('testTextareaValue')
        expect(snapshot).to.contain(
          `<textarea id="testTextareaValue" ${attr}="default value">default value</textarea>`,
        )
        testTextAreaIsCleaned(textarea, 'default value')
      })

      it('reverts changes', () => {
        const [textarea, snapshot] = createTextAreaSnapshot('testTextareaValue', 'new value')
        expect(snapshot).to.contain(
          `<textarea id="testTextareaValue" ${attr}="default value">new value</textarea>`,
        )
        testTextAreaIsCleaned(textarea, 'default value')
      })
    })

    function createTextAreaSnapshot(id: string, value?: string): [HTMLTextAreaElement, string] {
      const textarea = document.getElementById(id) as HTMLTextAreaElement
      if (value !== undefined) {
        textarea.value = value
      }

      const snapshot = subject.snapshot('test snapshot')
      return [textarea, snapshot]
    }

    function testTextAreaIsCleaned(textarea: HTMLTextAreaElement, value: string) {
      expect(textarea.value).to.equal(value)
      expect(textarea.innerHTML).to.equal(value)
      expect(textarea.outerHTML).to.equal(`<textarea id="${textarea.id}">${value}</textarea>`)
    }
  })

  function createCheckedInputSnapshot(id: string, checked?: boolean): [HTMLInputElement, string] {
    const input = document.getElementById(id) as HTMLInputElement
    if (checked !== undefined) {
      input.checked = checked
    }

    const snapshot = subject.snapshot('test snapshot')
    return [input, snapshot]
  }
})
