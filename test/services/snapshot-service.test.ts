import {describe} from 'mocha'
import {expect} from 'chai'
import {captureStdOut} from '../helpers/stdout'
import SnapshotService from '../../src/services/snapshot-service'
import * as nock from 'nock'

describe('SnapshotService', () => {
  let subject = new SnapshotService()
  const snapshotId = 1

  afterEach(() => {
    nock.cleanAll()
  })

  describe('#createSnapshot', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .post(/\/api\/v1\/builds\/\d+\/snapshots/)
        .reply(200, {data: {id: snapshotId}})
    })

    it('creates a snapshot', async () => {
      let createdSnapshotId: number | null = null

      await captureStdOut(async () => {
        createdSnapshotId = await subject.createSnapshot(
          snapshotId, 'my test', 'http://localhost/index.html', '<html><body></body></html>'
        )
      })

      expect(createdSnapshotId).to.equal(snapshotId)
    })
  })

  describe('#finalizeSnapshot', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .post(/\/api\/v1\/snapshots\/\d+\/finalize/)
        .reply(200, {})
    })

    it('creates finalizes a snapshot', async () => {
      let result = false

      await captureStdOut(async () => {
        result = await subject.finalizeSnapshot(snapshotId)
      })

      expect(result).to.equal(true)
    })
  })
})
