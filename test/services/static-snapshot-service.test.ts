import {describe} from 'mocha'
import { StaticSnapshotsConfiguration } from '../../src/configuration/static-snapshots-configuration'
import {DEFAULT_PORT} from '../../src/services/agent-service-constants'
import StaticSnapshotService from '../../src/services/static-snapshot-service'
import {captureStdOut} from '../helpers/stdout'
import chai from '../support/chai'

const expect = chai.expect

describe('StaticSnapshotService', () => {
  const staticSitePort = DEFAULT_PORT + 1

  const configuration: StaticSnapshotsConfiguration = {
    'port': staticSitePort,
    'path': './test/fixtures/services/static-snapshot-service/_dummy-testing-app/',
    'snapshot-files': '**/*.html,**/*.htm',
    'ignore-files': '**/blog/*',
    'base-url': '/',
  }

  const subject = new StaticSnapshotService(configuration)
  const localUrl = subject._buildLocalUrl()

  describe('#constructor', () => {
    it('creates a static snapshot service with the given arguments', () => {
      expect(subject.configuration).to.eq(configuration)
    })
  })

  describe('#start', () => {
    afterEach(async () => {
      await captureStdOut(() => subject.stop())
    })

    it('starts serving the static site on supplied port', async () => {
      await captureStdOut(() => subject.start())

      const response = await chai.request(localUrl).get('/index.html')

      expect(response).to.have.status(200)
      expect(response).to.have.header('content-type', /text\/html/)
    })

    it('logs to stdout that it is starting the static snapshot service', async () => {
      const stdout = await captureStdOut(() => subject.start())
      expect(stdout).to.eq(`[percy] serving static site at ${localUrl}\n`)
    })
  })

  describe('#_buildPageUrls with ignore flag set', () => {
    it('creates the expected number of snapshot urls', async () => {
      const pages = await subject._buildPageUrls()

      // these are the html files in test/fixtures/services/static-snapshot-service/_dummy-testing-app
      const expectedUrls = [
        'http://localhost:5339/about-us.html',
        'http://localhost:5339/index.html',
      ]

      expect(pages).to.eql(expectedUrls)
    })

  })

  describe('#_buildPageUrls without the ignore flag set', () => {
    const configuration: StaticSnapshotsConfiguration = {
      'port': staticSitePort,
      'path': './test/fixtures/services/static-snapshot-service/_dummy-testing-app/',
      'snapshot-files': '**/*.html,**/*.htm',
      'ignore-files': '',
      'base-url': '/',
    }

    const subject = new StaticSnapshotService(configuration)

    it('ignores the correct files', async () => {
      const pages = await subject._buildPageUrls()

      // these are the html files in test/fixtures/services/static-snapshot-service/_dummy-testing-app
      const expectedUrls = [
        'http://localhost:5339/about-us.html',
        'http://localhost:5339/index.html',
        'http://localhost:5339/blog/index.html',
      ]

      expect(pages).to.eql(expectedUrls)
    })
  })

  describe('#stop', () => {
    it('stops serving the static site on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start()
        await subject.stop()
      })

      try {
        await chai.request(localUrl).get('/')
      } catch (error) {
        expect(error).to.have.property('message', `connect ECONNREFUSED 127.0.0.1:${staticSitePort}`)
      }
    })

    it('logs to stdout that it is stopping the static snapshot service', async () => {
      await captureStdOut(() => subject.start())

      const stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.eq(`[percy] shutting down static site at ${localUrl}\n`)
    })
  })
})
