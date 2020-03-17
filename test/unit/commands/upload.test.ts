import { expect, test } from '@oclif/test'
import { describe } from 'mocha'
import * as sinon from 'sinon'
import Upload from '../../../src/commands/upload'
import ImageSnapshotService from '../../../src/services/image-snapshot-service'
import { captureStdErr, captureStdOut } from '../helpers/stdout'
import chai from '../support/chai'

describe('upload', () => {
  describe('#run', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
      // restore token to fake value
      process.env.PERCY_TOKEN = 'abc'
    })

    function ImageSnapshotServiceStub(): ImageSnapshotService {
      const imageSnapshotService = ImageSnapshotService.prototype as ImageSnapshotService
      sandbox.stub(imageSnapshotService, 'snapshotAll')

      return imageSnapshotService
    }

    it('starts the static image service', async () => {
      const imageSnapshotServiceStub = ImageSnapshotServiceStub()

      const stdout = await captureStdOut(async () => {
        await Upload.run(['.'])
      })

      chai.expect(imageSnapshotServiceStub.snapshotAll).to.have.callCount(1)
      chai.expect(stdout).not.to.match(/\[percy\] uploading snapshots of static images./)
    })

    it('warns about PERCY_TOKEN not being set and exits gracefully', async () => {
      process.env.PERCY_TOKEN = ''

      const stderr = await captureStdErr(async () => {
        await Upload.run(['.'])
      })

      chai.expect(stderr).to.match(/Warning: PERCY_TOKEN was not provided\./)
    })

    describe('with --dry-run', () => {
      it('does not upload snapshots', async () => {
        const imageSnapshotServiceStub = ImageSnapshotServiceStub()

        const stdout = await captureStdOut(async () => {
          await Upload.run(['./test/integration/test-static-images', '--dry-run'])
        })

        chai.expect(imageSnapshotServiceStub.snapshotAll).to.be.calledWith({ dry: true })
        chai.expect(stdout).not.to.match(/\[percy\] uploading snapshots of static images./)
      })

      it('prints paths to images matching the provided options', async () => {
        const stdout = await captureStdOut(async () => {
          await Upload.run([
            './test/integration/test-static-images',
            '--files=percy*',
            '--ignore=*.jpg',
            '--dry-run',
          ])
        })

        chai.expect(stdout).to.equal([
          'percy logo.png',
        ].join('\n') + '\n')
      })
    })
  })
})
