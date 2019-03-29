import {expect} from 'chai'
import * as sinon from 'sinon'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import Constants from '../../src/services/constants'
import { htmlWithoutSelector } from '../helpers/html-string'

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

    it('does not alter the DOM being snapshotted', () => {
      const originalHTML = htmlWithoutSelector(document, '#mocha')

      subject.snapshot('a snapshot')

      const postSnapshotHTML = htmlWithoutSelector(document, '#mocha')
      expect(postSnapshotHTML).to.eq(originalHTML)
      expect(postSnapshotHTML).to.not.contain('data-percy')
    })

    it('multiple snapshots produce the same result', () => {
      const firstDOMSnapshot = subject.snapshot('a snapshot')
      const secondDOMSnapshot = subject.snapshot('a second snapshot')
      expect(secondDOMSnapshot).to.eq(firstDOMSnapshot)
    })
  })
})
