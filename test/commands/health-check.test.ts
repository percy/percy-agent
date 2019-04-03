import * as chai from 'chai'
import * as nock from 'nock'
import {describe} from 'mocha'
import HealthCheck from '../../src/commands/health-check'
import {captureStdOut, captureStdErr} from '../helpers/stdout'

const expect = chai.expect

describe('Health check', () => {
  describe('when agent is running', () => {
    beforeEach(() => {
      nock(/localhost/).get('/percy/healthcheck').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('messages that agent is ready', async () => {
      const stdout = await captureStdOut(async () => await HealthCheck.run([]))

      expect(stdout).to.contain('[percy] percy is ready.')
    })
  })

  describe('when agent is not running', () => {
    beforeEach(() => {
      nock(/localhost/).get('/percy/healthcheck').reply(500)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('messages that agent is not ready', async () => {
      const errorStdout = await captureStdErr(async () => await HealthCheck.run([]))

      expect(errorStdout).to
        .contain('[percy] Failed to establish a connection with http://localhost:5338/percy/healthcheck')
    })

    it('properly passes the port', async () => {
      const port = '5899'
      const errorStdout = await captureStdErr(async () =>
        await HealthCheck.run(['--port', port])
      )

      expect(errorStdout).to
        .contain('[percy] Failed to establish a connection with http://localhost:5899/percy/healthcheck')
    })
  })
})
