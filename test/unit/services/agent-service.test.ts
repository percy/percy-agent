import {describe} from 'mocha'
import * as nock from 'nock'
import { DEFAULT_CONFIGURATION } from '../../../src/configuration/configuration'
import {AgentService} from '../../../src/services/agent-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'
const expect = chai.expect

describe('AgentService', () => {
  const subject = new AgentService()
  const configuration = DEFAULT_CONFIGURATION
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

      await chai.request(`http://localhost:${configuration.agent.port}`)
        .get('/percy-agent.js')
        .then((response) => {
          expect(response).to.have.status(200)
          expect(response).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('sends meta information with the healthcheck endpoint', async () => {
      await captureStdOut(() => subject.start(configuration))

      await chai.request(`http://localhost:${configuration.agent.port}`)
        .get('/percy/healthcheck')
        .then((response) => {
          expect(response).to.have.status(200)
          expect(response).to.be.json
          expect(response.body).to.deep.equal({
            success: true,
            build: {
              number: 1322,
              url: 'https://percy.io/test/test/builds/659575',
            },
          })
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

      await chai.request(`http://localhost:${configuration.agent.port}`)
        .get('/percy-agent.js')
        .catch((error) => {
          expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${configuration.agent.port}`)
        })
    })

    it('logs to stdout that it finalized a build', async () => {
      await captureStdOut(() => subject.start(configuration))
      const stdout = await captureStdOut(() => subject.stop())
      expect(stdout).to.match(/\[percy\] finalized build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
    })
  })
})
