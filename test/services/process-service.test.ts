import {expect} from 'chai'
import {describe} from 'mocha'
import ProcessService from '../../src/services/process-service'
import {createPidFile, deletePidFile} from '../helpers/process'

describe('ProcessService', () => {
  const subject = new ProcessService()

  afterEach(() => {
    deletePidFile()
  })

  describe('#isRunning', () => {
    it('returns false if not running', () => {
      expect(subject.isRunning()).to.equal(false)
    })

    it('returns true if running', () => {
      createPidFile()
      expect(subject.isRunning()).to.equal(true)
    })
  })

  describe('#getPid', () => {
    it('returns the pid', () => {
      createPidFile(123)
      expect(subject.getPid()).to.equal(123)
    })
  })

  describe('#runDetached', () => {
    it('returns pid of detached process', () => {
      expect(subject.runDetached(['bin/run'])).to.be.a('number')
    })

    it('returns null is process is already running', () => {
      createPidFile()
      expect(subject.runDetached(['bin/run'])).to.equal(undefined)
    })
  })

  describe('#kill', () => {
    it('kills a running process', () => {
      subject.runDetached(['bin/run', 'start', '--attached'])
      expect(subject.isRunning()).to.equal(true)

      subject.kill()
      expect(subject.isRunning()).to.equal(false)
    })
  })
})
