import * as chai from 'chai'
import {describe} from 'mocha'
import * as nock from 'nock'
import * as sinon from 'sinon'
import Exec from '../../src/commands/exec'
import {AgentService} from '../../src/services/agent-service'
import {DEFAULT_PORT} from '../../src/services/agent-service-constants'
import {captureStdOut} from '../helpers/stdout'

const expect = chai.expect

describe('Exec', () => {
  xdescribe('#run', () => {
    const sandbox = sinon.createSandbox()

    function AgentServiceStub(): AgentService {
      const agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      const start = new Exec([], '') as Exec
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

    it('starts and stops percy', async () => {
      const agentServiceStub = AgentServiceStub()

      const stdout = await captureStdOut(async () => {
        await Exec.run(['--', 'echo', 'hello'])
      })

      expect(agentServiceStub.start).to.calledWithMatch(DEFAULT_PORT)
      expect(stdout).to.match(/\[percy\] percy has started on port \d+./)
    })

    xit('starts percy on a specific port')
    xit('warns when percy is already running')
  })
})
