import { expect } from 'chai'
import * as cheerio from 'cheerio'
// @ts-ignore
import { check, type } from 'interactor.js'
import * as sinon from 'sinon'
import DOM from '../../src/percy-agent-client/dom'

// Create valid DOM to pass to the DOM class.
function createExample(dom: any) {
  let testContainer = document.querySelector('.test-container')

  if (testContainer) {
    testContainer.remove()
  }

  testContainer = document.createElement('div')

  const finalDOM = `
    <div class="container">
      <h1>Hello DOM testing</h1>
      ${dom}
    </div>
  `

  testContainer.classList.add('test-container')
  testContainer.innerHTML = finalDOM
  document.body.appendChild(testContainer)

  return document
}

// create a stylesheet in the DOM and add rules using the CSSOM
function createCSSOM() {
  const style = document.createElement('style')
  const testingContainer = document.querySelector('.test-container')

  style.type = 'text/css'
  testingContainer.appendChild(style)

  const cssomStyleSheet = document.styleSheets[0] as any

  cssomStyleSheet.insertRule('.box { height: 500px; width: 500px; background-color: green; }')
}

describe('DOM -', () => {
  let dom: any

  afterEach(() => {
    dom = null
  })

  // Ensure the snapshotString method always returns a string with a doctype.
  // The ideal way to test this is by passing a document without a doctype.
  // We would need a custom Karma file without a doctype to test that,
  // since the spec does not allow you to edit an existing documents doctype:
  // "DOM level 2 doesn't support editing the document type declaration."
  describe('snapshotString', () => {
    beforeEach(() => {
      dom = new DOM(document)
    })

    it('always has a doctype', () => {
      expect(dom.snapshotString()).to.contain('<!DOCTYPE html>')
    })
  })

  describe('passing a DOM transform option', () => {
    let consoleStub: any

    beforeEach(() => {
      consoleStub = sinon.stub(console, 'error')
      dom = new DOM(createExample('<span class="delete-me">Delete me</span>'), {
        domTransformation(dom: any) {
          const span = dom.querySelector('.delete-me')
          span.remove()

          return dom
        },
      })
    })

    afterEach(() => {
      consoleStub.restore()
    })

    it('transforms the DOM', () => {
      expect(dom.snapshotString()).to.not.contain('Delete me', 'delete-me')
    })

    it('does not modify the original DOM', () => {
      // @ts-ignore
      expect(document.querySelector('.delete-me').innerText).to.equal('Delete me')
    })

    // it's possible the user provides code that errors when we execute it
    it('gracefully catches errors', () => {
      expect(dom.snapshotString()).to.not.contain('Delete me', 'delete-me')
      expect(consoleStub.called).to.equal(false)
      // invoke the transform function again to try and remove a non-existent element
      expect(dom.snapshotString()).to.contain('Hello DOM testing')
      expect(consoleStub.calledOnce).to.equal(true)
    })
  })

  describe('stabilizing', () => {
    describe('CSSOM with JS disabled', () => {
      beforeEach(() => {
        const exampleDOM = createExample('<div class="box"></div>')

        createCSSOM()
        dom = new DOM(exampleDOM)
      })

      it('does not mutate the orignal DOM', () => {
        const cssomOwnerNode = document.styleSheets[0].ownerNode as any

        expect(cssomOwnerNode.innerText).to.equal('')
        expect(document.querySelectorAll('[data-percy-cssom-serialized]').length).to.equal(0)
      })

      it('serializes into the DOM clone', () => {
        const serializedCSSOM = dom.clonedDOM.querySelectorAll('[data-percy-cssom-serialized]')

        expect(serializedCSSOM.length).to.equal(1)
        expect(serializedCSSOM[0].innerText).to.equal('.box { height: 500px; width: 500px; background-color: green; }')
      })

      describe('adding new styles after snapshotting', () => {
        it('does not break the CSSOM', () => {
          const cssomSheet = document.styleSheets[0] as any
          // delete the old rule
          cssomSheet.deleteRule(0)
          // create a new rule
          cssomSheet.insertRule('.box { height: 200px; width: 200px; background-color: blue; }')

          expect(cssomSheet.cssRules.length).to.equal(1)
          expect(cssomSheet.cssRules[0].cssText).to
            .equal('.box { height: 200px; width: 200px; background-color: blue; }')
        })
      })
    })

    describe('CSSOM with JS enabled', () => {
      beforeEach(() => {
        const exampleDOM = createExample('<div class="box"></div>')

        createCSSOM()
        dom = new DOM(exampleDOM, { enableJavaScript: true })
      })

      it('does not serialize the CSSOM when JS is enabled', () => {
        const cssomOwnerNode = document.styleSheets[0].ownerNode as any

        expect(cssomOwnerNode.innerText).to.equal('')
        expect(dom.clonedDOM.querySelectorAll('[data-percy-cssom-serialized]').length).to.equal(0)
      })
    })

    describe('inputs', () => {
      let $domString: any

      beforeEach(async () => {
        const example = createExample(`
          <form>
            <label for="name">Name</label>
            <input id="name" type="text" />

            <input id="mailing" type="checkbox" />
            <label for="mailing">Subscribe?</label>

            <input id="radio" type="radio" />
            <label for="radio">Radio</label>

            <input id="nevercheckedradio" type="radio" />
            <label for="nevercheckedradio">Never checked</label>

            <label for="feedback">Feedback</label>
            <textarea id="feedback"></textarea>
          </form>
        `)

        await type('#name', 'Bob Boberson')
        await type('#feedback', 'This is my feedback... And it is not very helpful')
        await check('#radio')
        await check('#mailing')

        dom = new DOM(example)
        $domString = cheerio.load(dom.snapshotString())
      })

      it('serializes checked checkboxes', () => {
        expect($domString('#mailing').attr('checked')).to.equal('checked')
      })

      it('serializes checked radio buttons', () => {
        expect($domString('#radio').attr('checked')).to.equal('checked')
      })

      it('serializes textareas', () => {
        expect($domString('#feedback').attr('value')).to.equal(
          'This is my feedback... And it is not very helpful',
        )
      })

      it('serializes input elements', () => {
        expect($domString('#name').attr('value')).to.equal('Bob Boberson')
      })

      it('adds a guid data-attribute to the original DOM', () => {
        expect(document.querySelectorAll('[data-percy-element-id]').length).to.equal(5)
      })

      it('adds matching guids to the orignal DOM and cloned DOM', () => {
        const originalElementIds = document.querySelectorAll('[data-percy-element-id]')
        const cloneElementIds = dom.clonedDOM.querySelectorAll('[data-percy-element-id]')
        const originalValue = originalElementIds[0].attributes['data-percy-element-id'].value
        const cloneValue = cloneElementIds[0].attributes['data-percy-element-id'].value

        expect(originalValue).to.equal(cloneValue)
      })

      it('does not mutate values in origial DOM', () => {
        const originalDOMInput: any = document.querySelector('#name')

        expect(originalDOMInput.attributes.value).to.equal(undefined)
        expect(dom.clonedDOM.querySelector('#name').attributes.value.value).to.equal('Bob Boberson')
      })
    })

    describe('CSSOM with inputs', () => {
      let $domString: any

      beforeEach(async () => {
        const example = createExample(`
          <form>
            <label for="name">Name</label>
            <input id="name" type="text" />
          </form>
        `)
        createCSSOM()
        await type('#name', 'Bob Boberson')

        dom = new DOM(example)
        $domString = cheerio.load(dom.snapshotString())
      })

      it('serializes the input value', () => {
        expect($domString('#name').attr('value')).to.equal('Bob Boberson')
        expect(dom.clonedDOM.querySelector('#name').attributes.value.value).to.equal('Bob Boberson')
      })

      it('serializes the CSSOM', () => {
        const serializedCSSOM = dom.clonedDOM.querySelectorAll('[data-percy-cssom-serialized]')

        expect(serializedCSSOM.length).to.equal(1)
        expect(serializedCSSOM[0].innerText).to.equal('.box { height: 500px; width: 500px; background-color: green; }')
      })
    })
  })
})
