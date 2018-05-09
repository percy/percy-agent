import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdOut, captureStdErr} from '../helpers/stdout'
import Start from '../../src/commands/start'
import PercyCommand from '../../src/commands/percy-command'
import ProcessService from '../../src/services/process-service'
import AgentService from '../../src/services/agent-service'

const expect = chai.expect

describe('Start', () => {
  describe('#run', () => {
    let sandbox = sinon.createSandbox()

    function AgentServiceStub(): AgentService {
      let agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      let start = Start.prototype as Start
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    function ProcessServiceStub(pid: number | null): ProcessService {
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
      let agentServiceStub = AgentServiceStub()

      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(agentServiceStub.start).to.calledWithMatch(5338)
      expect(stdout).to.match(/info: percy-agent has started on port \d+. Logs available at log\/percy\-agent\.log/)
    })

    it('starts percy agent in detached mode', async () => {
      let processService = ProcessServiceStub(null)

      await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(processService.runDetached).to.calledWithMatch(
        ['bin/run', 'start', '--detached', '--port', '5338']
      )
    })

    it('starts percy agent on a specific port', async () => {
      let agentServiceStub = AgentServiceStub()

      let port = '55000'
      let options = ['--port', port]

      let stdout = await captureStdOut(async () => {
        await Start.run(options)
      })

      expect(agentServiceStub.start).to.calledWithMatch(+port)
      expect(stdout).to.contain(`info: percy-agent has started on port ${port}. Logs available at log/percy-agent.log`)
    })

    it('warns when percy agent is already running', async () => {
      ProcessServiceStub(null)

      let stdout = await captureStdOut(async () => {
        await Start.run(['--detached'])
      })

      expect(stdout).to.match(/warn: percy-agent is already running/)
    })

    it('errors when PERCY_TOKEN is missing', async () => {
      let percyCommand = PercyCommand.prototype as PercyCommand
      sandbox.stub(percyCommand, 'percyToken').returns('')

      let stderr = await captureStdErr(async () => {
        await Start.run(['--detached'])
      })

      expect(stderr).to.contain('You must set PERCY_TOKEN.')
    })

    it('errors when PERCY_PROJECT is missing', async () => {
      let percyCommand = PercyCommand.prototype as PercyCommand
      sandbox.stub(percyCommand, 'percyProject').returns('')

      let stderr = await captureStdErr(async () => {
        await Start.run(['--detached'])
      })

      expect(stderr).to.contain('You must set PERCY_PROJECT.')
    })
  })
})
