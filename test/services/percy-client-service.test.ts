import {expect} from 'chai'
import {describe} from 'mocha'
import PercyClientService from '../../src/services/percy-client-service'

describe('PercyClientService', () => {
  const subject = new PercyClientService()

  describe('#constructor', () => {
    it('creates a Percy Client', () => {
      const version = require('../../package.json').version

      expect(subject.percyClient).to.include({
        apiUrl: 'https://percy.io/api/v1',
        _clientInfo: `percy-agent/${version}`,
      })
    })
  })
})
