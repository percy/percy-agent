import * as chai from 'chai'
import {describe} from 'mocha'
import * as nock from 'nock'
import * as sinon from 'sinon'
import Stop from '../../../src/commands/stop'
import ProcessService from '../../../src/services/process-service'
import {captureStdOut} from '../helpers/stdout'
const expect = chai.expect

describe('Stop', () => {
  const sandbox = sinon.createSandbox()

  function stubProcessServiceWithIsRunning(isRunning: boolean): any {
    const processService = ProcessService.prototype as ProcessService
    sandbox.stub(processService, 'isRunning').returns(isRunning)

    const stop = new Stop([], '') as Stop
    sandbox.stub(stop, 'processService').returns(processService)

    return processService
  }

  afterEach(() => {
    nock.cleanAll()
    sandbox.restore()
  })

  describe('#run', () => {
    it('stops percy agent', async () => {
      stubProcessServiceWithIsRunning(true)
      nock(/localhost/).post('/percy/stop').replyWithError('socket hang up')

      const stdout = await captureStdOut(async () => {
        await Stop.run([])
      })

      expect(stdout).to.match(/\[percy\] percy stopped\./)
    })

    it('warns you when percy agent is already stopped', async () => {
      stubProcessServiceWithIsRunning(false)

      const stdout = await captureStdOut(async () => {
        await Stop.run([])
      })

      expect(stdout).to.match(/\[percy\] percy is already stopped\./)
    })
  })
})
