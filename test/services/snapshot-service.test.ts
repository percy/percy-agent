import {describe} from 'mocha'
import {expect} from 'chai'
import SnapshotService from '../../src/services/snapshot-service'
import * as nock from 'nock'

describe('SnapshotService', () => {
  let subject = new SnapshotService()

  beforeEach(async () => {
    nock('https://percy.io')
      .post(/\/api\/v1\/builds\/\d+\/snapshots/)
      .reply(200, {data: {id: 1}})
  })

  describe('#createSnapshot', () => {
    it('creates a snapshot', async () => {
      let snapshotId = await subject.createSnapshot(
        1, 'my test', 'http://localhost/index.html', '<html><body></body></html>'
      )

      expect(snapshotId).to.equal(1)
    })
  })
})
