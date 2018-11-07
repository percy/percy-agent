import {expect} from 'chai'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import * as sinon from 'sinon'
require('../../src/percy-agent-client/percy-agent')

describe('PercyAgent', () => {
  let requests: sinon.SinonFakeXMLHttpRequest[] = []
  let subject: PercyAgent
  let xhr: any

  beforeEach(() => {
    xhr = sinon.useFakeXMLHttpRequest()
    xhr.onCreate = (xhrRequest: any) => {
      requests.push(xhrRequest)
    }

    subject = new PercyAgent({
      clientInfo: 'Test Client',
      xhr
    })

    subject.client.agentConnected = true
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
    })

    it('serializes text input elements', () => {
      let inputName = document.getElementById('testInputText') as HTMLInputElement
      inputName.value = 'test input value'
      subject.snapshot('test snapshot')

      let request = requests[0]
      let requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('test input value')
    })

    it('serializes checkbox elements', () => {
      let inputName = document.getElementById('testCheckbox') as HTMLInputElement
      inputName.checked = true

      subject.snapshot('test snapshot')
      let request = requests[0]
      let requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('checked')
    })

    it('serializes radio button elements', () => {
      let inputName = document.getElementById('testRadioButton') as HTMLInputElement
      inputName.checked = true

      subject.snapshot('test snapshot')
      let request = requests[0]
      let requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('checked')
    })
  })
})
