import {describe} from 'mocha'
import {expect} from 'chai'
import PercyClientService from '../../src/services/percy-client-service'

describe('PercyClientService', () => {
  let subject = new PercyClientService()

  describe('#constructor', () => {
    it('creates a Percy Client', () => {
      expect(subject.percyClient).to.include({
        apiUrl: 'https://percy.io/api/v1',
        _clientInfo: 'percy-agent/XX'
      })
    })
  })
})
