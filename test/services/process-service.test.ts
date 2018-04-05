import {describe} from 'mocha'
import {expect} from 'chai'
import ProcessService from '../../src/services/process-service'
import {createPidFile, deletePidFile} from '../helpers/pid-file'

describe('ProcessService', () => {
  let subject = new ProcessService()

  describe('#isRunning', () => {
    it('returns false if not running', async () => {
      expect(await subject.isRunning()).to.equal(false)
    })

    it('returns true if running', async () => {
      await createPidFile(123)
      expect(await subject.isRunning()).to.equal(true)
      await deletePidFile()
    })
  })

  describe('#pid', () => {
    it('returns the pid', async () => {
      await createPidFile(456)
      expect(await subject.pid()).to.equal(456)
      await deletePidFile()
    })
  })
})
