import expect from 'expect'
import { execSync } from 'child_process'
import { when } from 'interactor.js'

import {
  launch,
  run,
  setupApiProxy,
  setupDummyApp
} from './helpers'

describe('Asset discovery', () => {
  let proxy = setupApiProxy()
  let dummy = setupDummyApp()

  it('does not create snapshots while stopping a build', async () => {
    let [stdout] = await run('percy exec -- node ./test/acceptance/dummy/snapshot-error.js');

    // TODO: Assert the "waitig for x" output & for no snapshot logs to occur *after*
    expect(stdout).toHaveEntries([
      '[percy] percy has started.',
      "[percy] snapshot taken: 'Home Page - 0'",
      '[percy] done.',
      '[percy] finalized build #4: <<build-url>>'
    ])
  })
})
