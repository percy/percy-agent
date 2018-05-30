import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import RequestService from '../../src/services/request-service'
import chai from '../support/chai'
import * as nock from 'nock'
const expect = chai.expect

describe('RequestService', () => {
  let subject = new RequestService()
  const requestManifest = ['https://percy.io/logo.svg']

  afterEach(() => {
    nock.cleanAll()

    // Clear the requests processed after each test so caching doesn't occur
    subject.requestsProcessed.clear()
  })

  describe('#processManifest', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .get('/logo.svg')
        .reply(200, '<svg></svg>', {'Content-Type': 'image/svg+xml'})
    })

    it('processes a request manifest', async () => {
      let resources: any[] = []

      await captureStdOut(async () => {
        resources = await subject.processManifest(requestManifest)
      })

      expect(resources[0]).to.include({
        mimetype: undefined,
        isRoot: undefined,
        resourceUrl: '/logo.svg',
        sha: 'b12e0d83ce2357d80b89c57694814d0a3abdaf8c40724f2049af8b7f01b7812b'
      })
    })
  })

  describe('#filterRequestManifest', () => {
    it('filters request manifest', async () => {
      let requestManifest: any[] = [
        'http://percy.io/logo.png',
        'http://percy.io/logo.png',
        '/app.css',
        'http://localhost:5338/percy/stop',
      ]
      let filteredRequestManifest = subject.filterRequestManifest(requestManifest)

      expect(filteredRequestManifest).to.deep.equal([
        'http://percy.io/logo.png',
        '/app.css',
      ])
    })
  })

  describe('#createLocalCopies', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .get('/logo.svg')
        .reply(200, '<svg></svg>', {'Content-Type': 'image/svg+xml'})

      nock('https://percy.io')
        .get('/app.css')
        .reply(200, 'body { background: green; }', {'Content-Type': 'image/svg+xml'})
    })

    it('creates local copies', async () => {
      let requestManifest: any[] = [
        'https://percy.io/app.css',
        'https://percy.io/logo.svg',
      ]
      let localCopies = await subject.createLocalCopies(requestManifest)

      let expectedResult = new Map(
        [['https://percy.io/app.css', './tmp/39c6ed7372d209cb3d8b85797161b7cadc7fa0c76370479dbe543f6c11c30b06'],
         ['https://percy.io/logo.svg', './tmp/b12e0d83ce2357d80b89c57694814d0a3abdaf8c40724f2049af8b7f01b7812b']]
      )

      expect(localCopies).to.deep.equal(expectedResult)
    })
  })

  describe('#makeLocalCopy', () => {
    let request = 'https://percy.io/logo.svg'
    let expectedFilename = './tmp/b12e0d83ce2357d80b89c57694814d0a3abdaf8c40724f2049af8b7f01b7812b'

    beforeEach(async () => {
      nock('https://percy.io')
        .get('/logo.svg')
        .reply(200, '<svg></svg>', {'Content-Type': 'image/svg+xml'})
    })

    it('creates a local copy', async () => {
      let localCopy = await subject.makeLocalCopy(request)
      expect(localCopy).to.deep.equal(expectedFilename)
    })

    it('skips requests that have already been made', async () => {
      let localCopy = await subject.makeLocalCopy(request)
      expect(localCopy).to.deep.equal(expectedFilename)

      let stdout = await captureStdOut(() => subject.makeLocalCopy(request))
      expect(stdout).to.match(/warn: skipping request, local copy already present/)
    })
  })
})
