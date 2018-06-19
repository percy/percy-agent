import {expect} from 'chai'
import {PercyAgentClient} from '../../src/percy-agent-client/percy-agent-client'
require('../../src/percy-agent-client/percy-agent-client')
import * as sinon from 'sinon'

describe('PercyAgentClient', () => {
  const subject = new PercyAgentClient()
  let xhr = sinon.useFakeXMLHttpRequest()
  let requests: sinon.SinonFakeXMLHttpRequest[] = []

  beforeEach(() => {
    xhr.onCreate = xhrRequest => {
      requests.push(xhrRequest)
    }
  })

  afterEach(() => {
    xhr.restore()
    requests = []
  })

  describe('#snapshot', () => {
    it('posts the percy agent process', () => {
      subject.snapshot('test snapshot')

      let request = requests[0]
      let requestBody = JSON.parse(request.requestBody)

      expect(request.url).to.equal('http://localhost:5338/percy/snapshot')
      expect(request.method).to.equal('post')

      expect(requestBody.name).to.equal('test snapshot')
      expect(requestBody.domSnapshot).to.contain('<html>')
    })
  })
})
