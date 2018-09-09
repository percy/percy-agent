import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import RequestService from '../../src/services/request-service'
import chai from '../support/chai'
import * as sinon from 'sinon'
import * as nock from 'nock'
import * as os from 'os'
const expect = chai.expect

describe('RequestService', () => {
  let subject = new RequestService()
  let sandbox = sinon.createSandbox()
  let tmpDir = os.tmpdir()
  const resourceBody = '<svg></svg>'
  const resourceSha = 'b12e0d83ce2357d80b89c57694814d0a3abdaf8c40724f2049af8b7f01b7812b'

  afterEach(() => {
    nock.cleanAll()
    sandbox.restore()

    // Clear the requests processed after each test so caching doesn't occur
    subject.requestsProcessed.clear()
  })

  describe('#processRequests', () => {
    const expectedResource = {
      mimetype: undefined,
      isRoot: undefined,
      content: undefined,
      resourceUrl: 'https://percy.io/logo.svg',
      sha: resourceSha,
      localPath: `${tmpDir}/${resourceSha}`
    }

    beforeEach(async () => {
      nock('https://percy.io')
        .get('/logo.svg')
        .reply(200, resourceBody, {'Content-Type': 'image/svg+xml'})

      sandbox.stub(subject, 'tmpDir').returns(tmpDir)
    })

    it('processes requests', async () => {
      const requests = ['https://percy.io/logo.svg']
      let resources: any[] = []

      await captureStdOut(async () => {
        resources = await subject.processRequests(requests)
      })

      expect(resources.length).to.eq(requests.length)
      expect(resources[0]).to.deep.equal(expectedResource)
    })

    it('filters anchors from requests', async () => {
      let resources: any[] = []
      const requestsWithAnchors = ['https://percy.io/logo.svg#thisIsAnAnchor']

      await captureStdOut(async () => {
        resources = await subject.processRequests(requestsWithAnchors)
      })

      expect(resources[0]).to.deep.equal(expectedResource)
    })

    it('filters duplicate requests', async () => {
      const requestsWithDups = [
        'https://percy.io/logo.svg',
        'https://percy.io/logo.svg'
      ]

      let stdout = await captureStdOut(async () => {
        await subject.processRequests(requestsWithDups)
      })

      expect(stdout).to.match(/info: filtered to 1 requests\.\.\./)
    })
  })
})
