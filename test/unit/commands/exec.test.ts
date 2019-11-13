import { describe } from 'mocha'
import * as nock from 'nock'
import * as sinon from 'sinon'
import Exec from '../../../src/commands/exec'
import { DEFAULT_CONFIGURATION } from '../../../src/configuration/configuration'
import { AgentService } from '../../../src/services/agent-service'
import { captureStdOut } from '../helpers/stdout'
import chai from '../support/chai'

const expect = chai.expect

describe('Exec', () => {
  describe('#run', () => {
    const sandbox = sinon.createSandbox()
    let agentServiceStub: AgentService

    function AgentServiceStub(): AgentService {
      const agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      const start = new Exec([], '') as Exec
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    beforeEach(() => {
      agentServiceStub = AgentServiceStub()
      nock(/localhost/).get('/percy/healthcheck').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
      sandbox.restore()
    })

    it('starts and stops percy', async () => {
      const stdout = await captureStdOut(async () => {
        await Exec.run(['--', 'sleep', '0'])
      })

      expect(agentServiceStub.start).to.calledWithMatch(DEFAULT_CONFIGURATION)
      expect(stdout).to.match(/\[percy\] percy has started./)
    })

    it('starts percy on a specific port', async () => {
      await captureStdOut(async () => {
        await Exec.run(['--port', '55000', '--', 'sleep', '0'])
      })

      expect(agentServiceStub.start).to.calledWithMatch({
        ...DEFAULT_CONFIGURATION,
        agent: { ...DEFAULT_CONFIGURATION.agent, port: 55000 },
      })
    })
  })
})
