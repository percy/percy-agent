import {expect} from 'chai'
import {describe} from 'mocha'
import * as nock from 'nock'
import SnapshotService from '../../src/services/snapshot-service'
import {captureStdOut} from '../helpers/stdout'

describe('SnapshotService', () => {
  const snapshotId = 1
  const buildId = 10

  const subject = new SnapshotService(buildId)

  beforeEach(async () => {
    nock('https://percy.io')
      .persist()
      .post(/\/api\/v1\/snapshots\/\d+\/finalize/)
      .reply(200, {})
  })

  afterEach(() => nock.cleanAll())

  describe('#create', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .persist()
        .post(/\/api\/v1\/builds\/\d+\/snapshots/)
        .reply(200, {data: {id: snapshotId}})
    })

    it('creates a snapshot', async () => {
      let snapshotResponse: any

      await captureStdOut(async () => {
        snapshotResponse = await subject.create(
          'my test', [],
        )
      })

      expect(snapshotResponse.body).to.deep.equal({data: {id: snapshotId}})
      expect(snapshotResponse.statusCode).to.eq(200)
    })

    it('creates multiple snapshots', async () => {
      let snaps: PromiseLike<any[]> = Promise.resolve([])

      await captureStdOut(async () => {
        const names = Array.from({ length: 100 }, (_, index) => `snapshot ${index}`)
        snaps = Promise.all(names.map((name) => subject.create(name, [])))
      })

      const res = await snaps
      res.forEach((snap) => {
        expect(snap.body).to.deep.equal({data: {id: snapshotId}})
        expect(snap.statusCode).to.eq(200)
      })
    })
  })

  describe('#finalize', () => {
    it('creates finalizes a snapshot', async () => {
      let result = false

      await captureStdOut(async () => {
        result = await subject.finalize(snapshotId)
      })

      expect(result).to.equal(true)
    })
  })
})
