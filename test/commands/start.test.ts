import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import Start from '../../src/commands/start'

const expect = chai.expect

describe('Start', () => {
  describe('#run', () => {
    let sandbox = sinon.createSandbox()

    function mockProcessServiceWithPid(pid: number | null) {
      let processServiceStub = sandbox.stub() as any
      processServiceStub.runDetached = sandbox.stub()
      processServiceStub.runDetached.returns(pid)

      let start = Start.prototype as Start

      sandbox.stub(start, 'processService').returns(processServiceStub)
    }

    beforeEach(() => {
      nock(/localhost/).get('/percy/healthcheck').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
      sandbox.restore()
    })

    it('starts percy agent', async () => {
      mockProcessServiceWithPid(123)

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(stdout).to.match(/info: percy-agent has started on port \d+. Logs available at log\/percy\-agent\.log/)
    })

    it('starts percy agent on a specific port', async () => {
      mockProcessServiceWithPid(123)

      let port = '55000'
      let options = ['--port', port]

      let stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(stdout).to.contain(`info: percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
    })

    it('warns when percy agent is already running', async () => {
      mockProcessServiceWithPid(null)

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(stdout).to.match(/warn: percy-agent is already running/)
    })
  })
})
