import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import Start from '../../src/commands/start'
import ProcessService from '../../src/services/process-service'

const expect = chai.expect

describe('Start', () => {
  describe('#run', () => {
    let sandbox = sinon.createSandbox()

    function stubProcessServiceWithPid(pid: number | null): any {
      let processService = ProcessService.prototype as ProcessService
      sandbox.stub(processService, 'runDetached').returns(pid)

      let start = Start.prototype as Start
      sandbox.stub(start, 'processService').returns(processService)

      return processService
    }

    beforeEach(() => {
      nock(/localhost/).get('/percy/healthcheck').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
      sandbox.restore()
    })

    it('starts percy agent', async () => {
      let processServiceStub = stubProcessServiceWithPid(123)

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(processServiceStub.runDetached).to.calledWithMatch(
        ['bin/run', 'start', '--attached', '--port', '5338']
      )
      expect(stdout).to.match(/info: percy-agent has started on port \d+. Logs available at log\/percy\-agent\.log/)
    })

    it('starts percy agent on a specific port', async () => {
      let processServiceStub = stubProcessServiceWithPid(123)

      let port = '55000'
      let options = ['--port', port]

      let stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(processServiceStub.runDetached).to.calledWithMatch(
        ['bin/run', 'start', '--attached', '--port', port]
      )
      expect(stdout).to.contain(`info: percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
    })

    it('warns when percy agent is already running', async () => {
      stubProcessServiceWithPid(null)

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(stdout).to.match(/warn: percy-agent is already running/)
    })
  })
})
