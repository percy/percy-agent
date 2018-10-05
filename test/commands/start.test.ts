import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import Start from '../../src/commands/start'
import ProcessService from '../../src/services/process-service'
import AgentService from '../../src/services/agent-service'

const expect = chai.expect
const path = require('path')

describe('Start', () => {
  describe('#run', () => {
    let sandbox = sinon.createSandbox()

    function AgentServiceStub(): AgentService {
      let agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      let start = new Start([], '') as Start
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    function ProcessServiceStub(pid: number | null): ProcessService {
      let processService = ProcessService.prototype as ProcessService
      sandbox.stub(processService, 'runDetached').returns(pid)

      let start = new Start([], '') as Start
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
      let agentServiceStub = AgentServiceStub()

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(agentServiceStub.start).to.calledWithMatch({port: 5338, networkIdleTimeout: 50})
      expect(stdout).to.contain('[percy] percy-agent has started.')
    })

    it('starts percy agent in detached mode', async () => {
      let processService = ProcessServiceStub(null)

      await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(processService.runDetached).to.calledWithMatch(
        [path.resolve(`${__dirname}/../../bin/run`), 'start', '-p', '5338', '-t', '50']
      )
    })

    it('starts percy agent on a specific port', async () => {
      let agentServiceStub = AgentServiceStub()

      let port = '55000'
      let options = ['--port', port]

      let stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(agentServiceStub.start).to.calledWithMatch({port: +port, networkIdleTimeout: 50})
      expect(stdout).to.contain('[percy] percy-agent has started.')
    })

    it('warns when percy agent is already running', async () => {
      ProcessServiceStub(null)

      let stdout = await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(stdout).to.match(/\[percy\] percy-agent is already running/)
    })
  })
})
