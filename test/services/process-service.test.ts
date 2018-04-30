import {describe} from 'mocha'
import {expect} from 'chai'
import ProcessService from '../../src/services/process-service'
import {createPidFile, deletePidFile} from '../helpers/process'

describe('ProcessService', () => {
  let subject = new ProcessService()

  afterEach(async () => {
    await deletePidFile()
  })

  describe('#isRunning', () => {
    it('returns false if not running', async () => {
      expect(await subject.isRunning()).to.equal(false)
    })

    it('returns true if running', async () => {
      await createPidFile()
      expect(await subject.isRunning()).to.equal(true)
    })
  })

  describe('#getPid', () => {
    it('returns the pid', async () => {
      await createPidFile(123)
      expect(await subject.getPid()).to.equal(123)
    })
  })

  describe('#runDetached', () => {
    it('returns pid of detached process', async () => {
      expect(await subject.runDetached(['bin/run'])).to.be.a('number')
    })

    it('returns null is process is already running', async () => {
      await createPidFile()
      expect(await subject.runDetached(['bin/run'])).to.equal(null)
    })
  })

  describe('#kill', () => {
    it('kills a running process', async () => {
      await subject.runDetached(['bin/run', 'start', '--attached'])
      expect(await subject.isRunning()).to.equal(true)

      await subject.kill()
      expect(await subject.isRunning()).to.equal(false)
    })
  })
})
