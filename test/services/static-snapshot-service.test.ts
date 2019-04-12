import {describe} from 'mocha'
import Constants from '../../src/services/constants'
import {StaticSnapshotOptions} from '../../src/services/static-snapshot-options'
import StaticSnapshotService from '../../src/services/static-snapshot-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'

const expect = chai.expect

describe('StaticSnapshotService', () => {
  const port = Constants.PORT
  const host = `localhost:${port}`

  const options: StaticSnapshotOptions = {
    port,
    staticAssetDirectory: './test/fixtures/_dummyTestingApp/',
    widths: [720, 1080],
    snapshotCaptureRegex: '\.(html|htm)$',
    baseUrl: '/',
  }

  const subject = new StaticSnapshotService(options)

  describe('#constructor', () => {
    it('creates a static snapshot service with the given arguments', () => {
      expect(subject._getOptions()).to.include(options)
    })
  })

  describe('#start', () => {
    afterEach(async () => {
      await captureStdOut(() => subject.stop())
    })

    it('starts serving the static site on supplied port', async () => {
      await captureStdOut(() => subject.start())

      await chai.request(`http://${host}`)
        .get('/')
        .end((error, response) => {
          expect(error).to.be.eq(null)
          expect(response).to.have.status(200)
          expect(response).to.have.header('content-type', /text\/html/)
        })
    })

    it('logs to stdout that it is starting the static snapshot service', async () => {
      const stdout = await captureStdOut(() => subject.start())
      expect(stdout).to.match(/\[percy\] starting static snapshot service.../)
    })
  })

  // describe('#snapshotAll', () => {
    // placeholder because I'm not sure how to test this without stubbing the Agent service
    // and that seems like overkill?
  // })

  describe('#_buildPageUrls', () => {
    it('creates the expected number of snapshot urls', async () => {
      const pages = await subject._buildPageUrls()

      // this is the number of html files in percy-agent/test/fixtures/_dummyTestingApp
      expect(pages.length).to.equal(2)
    })
  })

  describe('#stop', () => {
    it('stops serving the static site on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start()
        await subject.stop()
      })

      await chai.request(`http://${host}`)
        .get('/')
        .catch(async (error) => {
          await expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${port}`)
        })
    })

    it('logs to stdout that it is stopping the static snapshot service', async () => {
      await captureStdOut(() => subject.start())

      const stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.match(/\[percy\] stopping static snapshot service.../)
    })
  })
})
