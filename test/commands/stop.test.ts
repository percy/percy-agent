import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import ProcessService from '../../src/services/process-service'
import Stop from '../../src/commands/stop'
import {captureStdOut} from '../helpers/stdout'
const expect = chai.expect

describe('Stop', () => {
  let sandbox = sinon.createSandbox()

  function stubProcessServiceWithIsRunning(isRunning: boolean): any {
    let processService = ProcessService.prototype as ProcessService
    sandbox.stub(processService, 'isRunning').returns(isRunning)

    let stop = new Stop([], '') as Stop
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

      let stdout = await captureStdOut(async () => {
        await Stop.run([])
      })

      expect(stdout).to.match(/\[percy\] percy-agent stopped\./)
    })

    it('warns you when percy agent is already stopped', async () => {
      stubProcessServiceWithIsRunning(false)

      let stdout = await captureStdOut(async () => {
        await Stop.run([])
      })

      expect(stdout).to.match(/\[percy\] percy-agent is already stopped\./)
    })
  })
})
