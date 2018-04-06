import {describe} from 'mocha'
import {expect} from 'chai'
import ProcessService from '../../src/services/process-service'
import {createPidFile, deletePidFile} from '../helpers/process'

describe('ProcessService', () => {
  let subject = new ProcessService()

  describe('#isRunning', () => {
    it('returns false if not running', async () => {
      await deletePidFile()
      expect(await subject.isRunning()).to.equal(false)
    })

    it('returns true if running', async () => {
      await createPidFile()
      expect(await subject.isRunning()).to.equal(true)
      await deletePidFile()
    })
  })

  describe('#pid', () => {
    it('returns the pid', async () => {
      await createPidFile(123)
      expect(await subject.pid()).to.equal(123)
      await deletePidFile()
    })
  })

  describe('#runDetached', () => {
    it('returns pid of detached process', async () => {
      expect(await subject.runDetached(['bin/run'])).to.be.a('number')
      await deletePidFile()
    })

    it('returns null is process is already running', async () => {
      await createPidFile()
      expect(await subject.runDetached(['bin/run'])).to.equal(null)
      await deletePidFile()
    })
  })

  describe('#kill', () => {
    it('kills a running process', async () => {
      await subject.runDetached(['bin/run', 'start', 'attached'])
      expect(await subject.isRunning()).to.equal(true)

      await subject.kill()
      expect(await subject.isRunning()).to.equal(false)
    })
  })
})
