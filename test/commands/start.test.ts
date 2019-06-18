import * as chai from 'chai'
import {describe} from 'mocha'
import * as nock from 'nock'
import * as path from 'path'
import * as sinon from 'sinon'
import Start from '../../src/commands/start'
import {AgentService} from '../../src/services/agent-service'
import {DEFAULT_PORT} from '../../src/services/agent-service-constants'
import {DEFAULT_NETWORK_IDLE_TIMEOUT} from '../../src/services/asset-discovery-service'
import ProcessService from '../../src/services/process-service'
import {captureStdOut} from '../helpers/stdout'

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

      expect(agentServiceStub.start).to.calledWithMatch({
        'asset-discovery': {'network-idle-timeout': DEFAULT_NETWORK_IDLE_TIMEOUT },
        'port': DEFAULT_PORT,
      })
      expect(stdout).to.contain('[percy] percy has started.')
    })

    it('starts percy agent in detached mode', async () => {
      const processService = ProcessServiceStub()

      await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(processService.runDetached).to.calledWithMatch(
        [path.resolve(`${__dirname}/../../bin/run`), 'start', '-p', String(DEFAULT_PORT), '-t', '50'],
      )
    })

    it('starts percy agent on a specific port', async () => {
      const agentServiceStub = AgentServiceStub()

      const port = '55000'
      const options = ['--port', port]

      const stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(agentServiceStub.start).to.calledWithMatch({
        'asset-discovery': {'network-idle-timeout': 50 },
        'port': 55000,
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
