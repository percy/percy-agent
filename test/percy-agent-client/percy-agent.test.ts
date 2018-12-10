import {expect} from 'chai'
import * as sinon from 'sinon'
import PercyAgent from '../../src/percy-agent-client/percy-agent'

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
      xhr,
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

      const request = requests[0]
      const requestBody = JSON.parse(request.requestBody)

      expect(request.url).to.equal('http://localhost:5338/percy/snapshot')
      expect(request.method).to.equal('post')
      expect(requestBody.name).to.equal('test snapshot')
    })

    it('posts the percy agent process with options', () => {
      subject.snapshot(
        'test snapshot with options',
        {enableJavaScript: true, widths: [320, 1024], minHeight: 512},
      )

      const request = requests[0]
      const requestBody = JSON.parse(request.requestBody)

      expect(request.url).to.equal('http://localhost:5338/percy/snapshot')
      expect(request.method).to.equal('post')
      expect(requestBody.name).to.equal('test snapshot with options')
      expect(requestBody.enableJavaScript).to.equal(true)
      expect(requestBody.widths).to.eql([320, 1024])
      expect(requestBody.minHeight).to.equal(512)
    })

    it('serializes text input elements', () => {
      const inputName = document.getElementById('testInputText') as HTMLInputElement
      inputName.value = 'test input value'
      subject.snapshot('test snapshot')

      const request = requests[0]
      const requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('test input value')
    })

    it('serializes checkbox elements', () => {
      const inputName = document.getElementById('testCheckbox') as HTMLInputElement
      inputName.checked = true

      subject.snapshot('test snapshot')
      const request = requests[0]
      const requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('checked')
    })

    it('serializes radio button elements', () => {
      const inputName = document.getElementById('testRadioButton') as HTMLInputElement
      inputName.checked = true

      subject.snapshot('test snapshot')
      const request = requests[0]
      const requestBody = JSON.parse(request.requestBody)

      expect(requestBody.domSnapshot).to.contain('checked')
    })
  })
})
