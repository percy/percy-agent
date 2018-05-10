import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import ProcessService from '../../src/services/process-service'
import PercyCommand from '../../src/commands/percy-command'
import Stop from '../../src/commands/stop'

import {captureStdOut, captureStdErr} from '../helpers/stdout'
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

      expect(stdout).to.match(/info: percy-agent stopped\./)
    })

    it('warns you when percy agent is already stopped', async () => {
      stubProcessServiceWithIsRunning(false)

      let stdout = await captureStdOut(async () => {
        await Stop.run([])
      })

      expect(stdout).to.match(/warn: percy-agent is already stopped\./)
    })

    it('errors when PERCY_TOKEN is missing', async () => {
      let percyCommand = PercyCommand.prototype as PercyCommand
      sandbox.stub(percyCommand, 'percyToken').returns('')

      let stderr = await captureStdErr(async () => {
        await Stop.run([])
      })

      expect(stderr).to.contain('You must set PERCY_TOKEN.')
    })

    it('errors when PERCY_PROJECT is missing', async () => {
      let percyCommand = PercyCommand.prototype as PercyCommand
      sandbox.stub(percyCommand, 'percyProject').returns('')

      let stderr = await captureStdErr(async () => {
        await Stop.run([])
      })

      expect(stderr).to.contain('You must set PERCY_PROJECT.')
    })
  })
})
