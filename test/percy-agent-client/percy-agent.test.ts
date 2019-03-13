import {expect} from 'chai'
import * as sinon from 'sinon'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import Constants from '../../src/services/constants'

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

    if (subject.client) {
      subject.client.agentConnected = true
    }
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

      expect(request.url).to.equal(`http://localhost:${Constants.PORT}${Constants.SNAPSHOT_PATH}`)
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

      expect(request.url).to.equal(`http://localhost:${Constants.PORT}${Constants.SNAPSHOT_PATH}`)
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

    it('scopes the snapshot to the given selector', () => {
      const classSnapshot = subject.snapshot('test snapshot', { scope: '.scope-class' })
      expect(classSnapshot).to.contain('First content')
      expect(classSnapshot).to.contain('Second content')
      expect(classSnapshot).to.not.contain('inside of id #scope-id')
    })

    // TODO: Add more exhaustive tests for failure cases.
  })
})
