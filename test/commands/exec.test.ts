import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import Exec from '../../src/commands/exec'
import AgentService from '../../src/services/agent-service'

const expect = chai.expect

describe('Exec', () => {
  describe('#run', () => {
    let sandbox = sinon.createSandbox()

    function AgentServiceStub(): AgentService {
      let agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      let start = new Exec([], '') as Exec
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    beforeEach(() => {
      nock(/localhost/).get('/percy/healthcheck').reply(200)
    })

    afterEach(() => {
      nock.cleanAll()
      sandbox.restore()
    })

    it('starts and stops percy agent', async () => {
      let agentServiceStub = AgentServiceStub()

      let stdout = await captureStdOut(async () => {
        await Exec.run(['--', 'echo', 'hello'])
      })

      expect(agentServiceStub.start).to.calledWithMatch(5338)
      expect(stdout).to.match(/info: percy-agent has started on port \d+./)
    })

    it('starts percy agent on a specific port', async () => {
    })

    it('warns when percy agent is already running', async () => {
    })
  })
})
