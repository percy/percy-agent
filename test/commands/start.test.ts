import {describe} from 'mocha'
import Start from '../../src/commands/start'
import Stop from '../../src/commands/stop'
import * as chai from 'chai' // maybe can delete this?
import * as nock from 'nock'
import {captureStdOut} from '../helpers/stdout'
const expect = chai.expect

describe('Start', () => {
  beforeEach(() => {
    const buildCreateResponse = require('../fixtures/build-create.json')

    nock('https://percy.io')
      .post('/api/v1/projects/test/test/builds/')
      .reply(201, buildCreateResponse)

    nock('https://percy.io')
      .post(/\/api\/v1\/builds\/\d+\/finalize/)
      .reply(200, '{"success":true}')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('#run', () => {
    it('starts percy agent', async () => {
      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(stdout).to.match(/info: percy-agent has started on port \d+. Logs available at log\/percy\-agent\.log/)
      await captureStdOut(() => Stop.run([]))
    })

    it('starts percy agent on a specific port', async () => {
      let port = '55000'
      let options = ['--port', port]

      let stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(stdout).to.contain(`info: percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)

      await captureStdOut(() => Stop.run(options))
    })

    it('warns when percy agent is already running', async () => {
      let stdout = await captureStdOut(async () => {
        await Start.run([])
        await Start.run([])
      })

      expect(stdout).to.match(/warn: percy-agent is already running/)
      await captureStdOut(() => Stop.run([]))
    })
  })
})
