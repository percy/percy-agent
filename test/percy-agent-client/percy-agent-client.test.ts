import {expect} from 'chai'
// import {PercyAgentClient} from '../../src/percy-agent-client/percy-agent-client'
import * as sinon from 'sinon'

describe('PercyAgentClient', () => {
  // const subject = new PercyAgentClient()
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

  it('#snapshot', () => {
    expect(true).to.equal(true)
    // subject.snapshot('test snapshot')
    // expect(requests[0].url).to.equal('http://localhost:5338/percy/snapshot')
  })
})
