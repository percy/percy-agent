import {describe} from 'mocha'
import * as nock from 'nock'
import * as path from 'path'
import * as sinon from 'sinon'
import Start from '../../../src/commands/start'
import { DEFAULT_CONFIGURATION } from '../../../src/configuration/configuration'
import {AgentService} from '../../../src/services/agent-service'
import ProcessService from '../../../src/services/process-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'

const expect = chai.expect

describe('Start', () => {
  describe('#run', () => {
    const sandbox = sinon.createSandbox()

    function AgentServiceStub(): AgentService {
      const agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      const start = new Start([], '') as Start
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    function ProcessServiceStub(pid?: number): ProcessService {
      const processService = ProcessService.prototype as ProcessService
      sandbox.stub(processService, 'runDetached').returns(pid)

      const start = new Start([], '') as Start
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
      const agentServiceStub = AgentServiceStub()

      const stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(agentServiceStub.start).to.calledWithMatch(DEFAULT_CONFIGURATION)
      expect(stdout).to.contain('[percy] percy has started.')
    })

    it('starts percy agent in detached mode', async () => {
      const processService = ProcessServiceStub()

      await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(processService.runDetached).to.calledWithMatch(
        [
          path.resolve(`${__dirname}/../../../bin/run`),
          'start',
        ],
      )
    })

    it('starts percy agent in detached mode with flags', async () => {
      const processService = ProcessServiceStub()

      await captureStdOut(async () => {
        await Start.run(['--detached', '-p', '55000', '-t', '100'])
      })

      expect(processService.runDetached).to.calledWithMatch(
        [
          path.resolve(`${__dirname}/../../../bin/run`),
          'start',
          '-p', 55000,
          '-t', 100,
        ],
      )
    })

    it('starts percy agent on a specific port', async () => {
      const agentServiceStub = AgentServiceStub()

      const stdout = await captureStdOut(async () => {
        await Start.run(['--port', '55000'])
      })

      expect(agentServiceStub.start).to.calledWithMatch({
        ...DEFAULT_CONFIGURATION,
        agent: { ...DEFAULT_CONFIGURATION.agent, port: 55000 },
      })

      expect(stdout).to.contain('[percy] percy has started.')
    })

    it('warns when percy agent is already running', async () => {
      ProcessServiceStub()

      const stdout = await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(stdout).to.match(/\[percy\] percy is already running/)
    })
  })
})
