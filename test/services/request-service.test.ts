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
        content: undefined,
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
})
