import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import AgentService from '../../src/services/agent-service'
import chai from '../support/chai'
import * as nock from 'nock'
const expect = chai.expect

describe('AgentService', () => {
  const subject = new AgentService()
  const port = 5338
  const host = `localhost:${port}`
  const buildCreateResponse = require('../fixtures/build-create.json')
  const buildId = buildCreateResponse.data.id

  beforeEach(() => {
    nock('https://percy.io')
      .post('/api/v1/builds/')
      .reply(201, buildCreateResponse)

    nock('https://percy.io')
      .post(`/api/v1/builds/${buildId}/finalize`)
      .reply(201, {data: {id: buildId}})
  })

  afterEach(() => nock.cleanAll())

  describe('#start', () => {
    afterEach(async () => {
      await captureStdOut(() => subject.stop())
    })

    it('starts serving dist/public on supplied port', async () => {
      await captureStdOut(() => subject.start(port))

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end((error, response) => {
          expect(error).to.be.null
          expect(response).to.have.status(200)
          expect(response).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('logs to stdout that it created a build', async () => {
      let stdout = await captureStdOut(() => subject.start(port))
      expect(stdout).to.match(/\[percy\] created build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
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
        .catch(async error => {
          await expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${port}`)
        })
    })

    it('logs to stdout that it finalized a build', async () => {
      await captureStdOut(() => subject.start(port))

      let stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.match(/\[percy\] finalized build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
    })
  })
})
