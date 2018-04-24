import {describe} from 'mocha'
import Start from '../../src/commands/start'
import Stop from '../../src/commands/stop'
import * as chai from 'chai'
import {captureStdOut} from '../helpers/stdout'
const expect = chai.expect

describe('Start', () => {
  afterEach(async () => {
    await captureStdOut(() => Stop.run(['--force']))
  })

  describe('#run', () => {
    it('starts percy agent', async () => {
      let stdout = await captureStdOut(async () => {
        await Start.run([])
      })

      expect(stdout).to.match(/info: percy-agent\[\d+\] has started on port \d+/)
    })

    it('starts percy agent on a specific port', async () => {
      let stdout = await captureStdOut(async () => {
        await Start.run(['--port', '55000'])
      })

      expect(stdout).to.match(/info: percy-agent\[\d+\] has started on port 55000/)
    })

    it('warns when percy agent is already running', async () => {
      let stdout = await captureStdOut(async () => {
        await Start.run([])
        await Start.run([])
      })

      expect(stdout).to.match(/info: percy-agent\[\d+\] has started on port \d+/)
      expect(stdout).to.match(/warn: percy-agent is already running/)
    })
  })
})
