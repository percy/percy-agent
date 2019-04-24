import {describe} from 'mocha'
import Constants from '../../src/services/constants'
import {StaticSnapshotOptions} from '../../src/services/static-snapshot-options'
import StaticSnapshotService from '../../src/services/static-snapshot-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'

const expect = chai.expect

describe('StaticSnapshotService', () => {
  const options: StaticSnapshotOptions = {
    port: Constants.PORT,
    snapshotDirectory: './test/fixtures/services/static-snapshot-service/_dummy-testing-app/',
    snapshotFilesRegex: '\.(html|htm)$',
    ignoreFilesRegex: '',
    baseUrl: '/',
  }

  const subject = new StaticSnapshotService(options)
  const localUrl = subject._buildLocalUrl()

  describe('#constructor', () => {
    it('creates a static snapshot service with the given arguments', () => {
      expect(subject.options).to.eq(options)
    })
  })

  describe('#start', () => {
    afterEach(async () => {
      await captureStdOut(() => subject.stop())
    })

    it('starts serving the static site on supplied port', async () => {
      await captureStdOut(() => subject.start())

      await chai.request(localUrl)
        .get('/')
        .end((error, response) => {
          expect(error).to.be.eq(null)
          expect(response).to.have.status(200)
          expect(response).to.have.header('content-type', /text\/html/)
        })
    })

    it('logs to stdout that it is starting the static snapshot service', async () => {
      const stdout = await captureStdOut(() => subject.start())
      console.log(localUrl)
      expect(stdout).to.eq(`[percy] serving static site at ${localUrl}\n`)
    })
  })

  describe('#_buildPageUrls', () => {
    it('creates the expected number of snapshot urls', async () => {
      const pages = await subject._buildPageUrls()

      // this is the number of html files in test/fixtures/services/static-snapshot-service/_dummy-testing-app
      expect(pages.length).to.equal(2)
    })
  })

  describe('#stop', () => {
    it('stops serving the static site on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start()
        await subject.stop()
      })

      await chai.request(localUrl)
        .get('/')
        .catch(async (error) => {
          await expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${Constants.PORT}`)
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
