import { expect } from 'chai'
import * as cheerio from 'cheerio'
// @ts-ignore
import { check, type } from 'interactor.js'
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
      <h1>Hello world</h1>
      ${dom}
    </div>
  `

  testContainer.classList.add('test-container')
  testContainer.innerHTML = finalDOM
  document.body.appendChild(testContainer)

  return document
}
// This is just to ignore the empty tests for now
// tslint:disable
describe('DOM -', () => {
  let dom: any

  afterEach(() => {
    dom = null
  })

  // This is going to be a little hard to test. From the spec:
  // "DOM level 2 doesn't support editing the document type declaration."
  describe('without a doctype', () => {
    beforeEach(() => {})

    it('adds a doctype', () => {})
  })

  describe('passing a DOM transform option', () => {
    beforeEach(() => {
      // TODO, this can only be called once (since we delete from the DOM). Seems bad?
      dom = new DOM(createExample('<span class="delete-me">Delete me</span>'), {
        domTransformation(dom: any) {
          dom.querySelector('.delete-me').remove()
          return dom
        },
      })
    })

    it('transforms the DOM', () => {
      expect(dom.snapshotString()).to.not.contain('Delete me', 'delete-me')
    })

    it('does not modify the original DOM', () => {
      // @ts-ignore
      expect(document.querySelector('.delete-me').innerText).to.equal('Delete me')
    })
  })

  describe('stabilizing', () => {
    describe('CSSOM', () => {
      it('does not mutate the orignal DOM', () => {})

      it('serializes into the DOM clone', () => {})

      it('does not mutate the CSSOM owner node', () => {})

      it('does not serialize the CSSOM when JS is enabled', () => {})
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
  })
})
