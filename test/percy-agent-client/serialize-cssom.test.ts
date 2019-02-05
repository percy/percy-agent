import {expect} from 'chai'
import * as sinon from 'sinon'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import Constants from '../../src/services/constants'

describe('serializeCssOm', () => {
  const subject: PercyAgent = new PercyAgent({ handleAgentCommunication: false })

  describe('dom snapshot', () => {
    it('serializes JS-applied styles', () => {
      const jsStyledDiv = document.getElementById('jsStyled') as HTMLInputElement
      jsStyledDiv.style.background = 'red'

      const domSnapshot = subject.snapshot('test snapshot')
      expect(domSnapshot).to.contain('data-percy-cssom-serialized')

      const parsedDoc = (new DOMParser()).parseFromString(domSnapshot, 'text/html')
      expect(parsedDoc.getElementById('jsStyled')!.style.background).to.contain('red')
    })
  })
})
