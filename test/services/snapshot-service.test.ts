import {describe} from 'mocha'
import {expect} from 'chai'
import {captureStdOut} from '../helpers/stdout'
import SnapshotService from '../../src/services/snapshot-service'
import * as nock from 'nock'

describe('SnapshotService', () => {
  const snapshotId = 1
  const buildId = 10

  let subject = new SnapshotService(buildId)

  beforeEach(async () => {
    nock('https://percy.io')
      .post(/\/api\/v1\/snapshots\/\d+\/finalize/)
      .reply(200, {})
  })

  afterEach(() => nock.cleanAll())

  describe('#createSnapshot', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .post(/\/api\/v1\/builds\/\d+\/snapshots/)
        .reply(200, {data: {id: snapshotId}})
    })

    it('creates a snapshot', async () => {
      let snapshotResponse: any

      await captureStdOut(async () => {
        snapshotResponse = await subject.createSnapshot(
          'my test', []
        )
      })

      expect(snapshotResponse.body).to.deep.equal({data: {id: snapshotId}})
      expect(snapshotResponse.statusCode).to.eq(200)
    })
  })

  describe('#finalizeSnapshot', () => {
    it('creates finalizes a snapshot', async () => {
      let result = false

      await captureStdOut(async () => {
        result = await subject.finalizeSnapshot(snapshotId)
      })

      expect(result).to.equal(true)
    })
  })
})
