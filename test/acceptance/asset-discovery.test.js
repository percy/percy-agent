import expect from 'expect'
import {
  run,
  setupApiProxy,
  setupDummyApp
} from './helpers'

describe('Asset discovery', () => {
  let proxy = setupApiProxy()
  let dummy = setupDummyApp()

  it('does not create snapshots while stopping a build', async () => {
    let [stdout] = await run('percy exec -- node ./test/acceptance/dummy/snapshot-error.js');

    let finalizeReqDate = proxy.requests['/builds/123/finalize'][0].requestDate;
    let lastSnapshotReqDate = proxy.requests['/builds/123/snapshots'].pop().requestDate;

    expect(finalizeReqDate > lastSnapshotReqDate).toBe(true)
    expect(stdout).toHaveEntries([
      '[percy] percy has started.',
      /^\[percy\] waiting for \d+ snapshots to complete\.\.\.$/m,
      "[percy] snapshot taken: 'Home Page - 0'",
      '[percy] done.',
      '[percy] finalized build #4: <<build-url>>'
    ])
  })
})
