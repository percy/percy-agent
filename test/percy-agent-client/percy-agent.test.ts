import {expect} from 'chai'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
require('../../src/percy-agent-client/percy-agent')
import * as sinon from 'sinon'

describe('PercyAgent', () => {
  let xhr = sinon.useFakeXMLHttpRequest()
  const subject = new PercyAgent({
    clientInfo: 'Test Client',
    xhr
  })
  let requests: sinon.SinonFakeXMLHttpRequest[] = []

  beforeEach(() => {
    xhr.onCreate = xhrRequest => {
      requests.push(xhrRequest)
    }
  })

  afterEach(() => {
    // xhr.restore
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
