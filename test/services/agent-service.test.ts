import {describe} from 'mocha'
import * as nock from 'nock'
import {AgentService} from '../../src/services/agent-service'
import ConfigurationService from '../../src/services/configuration-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'
const expect = chai.expect

describe('AgentService', () => {
  const subject = new AgentService()
  const configuration = ConfigurationService.DEFAULT_CONFIGURATION
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
      await captureStdOut(() => subject.start(configuration))

      chai.request(`http://localhost:${configuration.agent.port}`)
        .get('/percy-agent.js')
        .end((error, response) => {
          expect(error).to.be.eq(null)
          expect(response).to.have.status(200)
          expect(response).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('logs to stdout that it created a build', async () => {
      const stdout = await captureStdOut(() => subject.start(configuration))
      expect(stdout).to.match(/\[percy\] created build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
    })
  })

  describe('#stop', () => {
    it('stops serving dist/public on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start(configuration)
        await subject.stop()
      })

      chai.request(`http://localhost:${configuration.agent.port}`)
        .get('/percy-agent.js')
        .catch(async (error) => {
          await expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${configuration.agent.port}`)
        })
    })

    it('logs to stdout that it finalized a build', async () => {
      await captureStdOut(() => subject.start(configuration))

      const stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.match(/\[percy\] finalized build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
    })
  })
})
