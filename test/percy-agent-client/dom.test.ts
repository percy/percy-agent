import {expect} from 'chai'
import DOM from '../../src/percy-agent-client/dom'
// tslint:disable
describe('DOM -', () => {
  let dom: any

  afterEach(() => {
    dom = null
  })

  describe('without a doctype', () => {
    beforeEach(() => {
      // dom = new DOM()
    })

    it('adds a doctype', () => {

    })
  })

  describe('passing a DOM transform option', () => {
    it('transforms the DOM', () => {

    })
  })

  describe('stabilizing', () => {
    describe('CSSOM', () => {
      it('does not mutate the orignal DOM', () => {

      })

      it('serializes into the DOM clone', () => {

      })

      it('does not mutate the CSSOM owner node', () => {

      })

      it('does not serialize the CSSOM when JS is enabled', () => {

      })
    })

    describe('inputs', () => {
      it('serializes checked checkboxes', () => {

      })

      it('serializes checked radio buttons', () => {

      })

      it('serializes textareas', () => {

      })

      it('serializes input elements', () => {

      })

      it('adds a guid data-attribute to the original DOM', () => {

      })

      it('does not mutate values in origial DOM', () => {

      })
    })
  })
})
