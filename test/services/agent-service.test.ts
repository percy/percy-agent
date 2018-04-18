import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import AgentService from '../../src/services/agent-service'
import * as chai from 'chai'
import * as nock from 'nock'
const expect = chai.expect
chai.use(require('chai-http'))

describe('AgentService', () => {
  let subject = new AgentService()
  let port = 34931
  let host = `localhost:${port}`

  beforeEach(() => {
    const buildCreateResponse = require('../fixtures/build-create.json')

    nock('https://percy.io')
      .post('/api/v1/projects/test/test/builds/')
      .reply(201, buildCreateResponse)

    nock('https://percy.io')
      .post(/\/api\/v1\/builds\/\d+\/finalize/)
      .reply(200, '{"success":true}')
  })

  afterEach(async () => {
    await captureStdOut(() => subject.stop())
  })

  describe('#start', () => {
    it('starts serving dist/public on supplied port', async () => {
      await captureStdOut(() => subject.start(port))

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('logs to stdout that it created a build', async () => {
      let stdout = await captureStdOut(() => subject.start(port))
      expect(stdout).to.match(/\[info\] BuildService#createBuild\[Build \d+\]\: created/)
    })

    it('responds to /percy/snapshot', async () => {
      await subject.start(port)

      nock('https://percy.io')
        .get('/logo.svg')
        .reply(200, '<svg></svg>')

      nock('https://percy.io')
        .post(/\/api\/v1\/snapshots\/\d+\/finalize/)
        .reply(201, '')

      nock('https://percy.io')
        .post(/\/api\/v1\/builds\/\d+\/snapshots/)
        .reply(201, {data: {id: 1}})

      chai.request(`http://${host}`)
        .post('/percy/snapshot')
        .send({
          name: 'test',
          url: 'http://localhost/index.html',
          enableJavascript: true,
          widths: [500, 1000, 2000],
          clientUserAgent: 'percy-agent/test-suite',
          requestManifest: ['http://percy.io/logo.svg'],
          domSnapshot: '<html><body><img src="http://percy.io/logo.svg"/></body></html>'
        })
        .end(function (err, res) {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/json/)
          expect(JSON.stringify(res.body)).to.equal('{"sucess":true}')
        })
    })
  })

  describe('#stop', () => {
    it('stops serving dist/public on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start(port)
        await subject.stop()
      })

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          expect(res).to.be.undefined
          expect(err).to.be.an('error')
            .with.property('message', `connect ECONNREFUSED 127.0.0.1:${port}`)
        })
    })

    it('logs to stdout that it finalized a build', async () => {
      await captureStdOut(() => subject.start(port))

      let stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.match(/\[info\] BuildService#createBuild\[Build \d+\]\: finalized/)
    })
  })
})
