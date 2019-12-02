import expect from 'expect'
import { when } from 'interactor.js'

import {
  run,
  setupApiProxy,
  agentIsReady
} from './helpers'

describe('percy start', () => {
  let proxy = setupApiProxy()

  it('warns and exits when PERCY_TOKEN is missing', async () => {
    let [stdout, stderr, code] = await run('percy start', { PERCY_TOKEN: '' })
    expect(stderr).toHaveEntry('Warning: Skipping visual tests. PERCY_TOKEN was not provided.')
    expect(stdout).toHaveLength(0)
    expect(code).toBe(0)
  })

  it('starts the agent server and stops it when the process is killed', async () => {
    let start = run('percy start')

    // kill the process as soon as it's ready
    await agentIsReady()
    // puppeteer will complain if we kill the process while it is launching chrome; wait 100ms
    setTimeout(() => start.child.kill(), 100)

    let [stdout, stderr] = await start

    expect(stderr).toHaveLength(0)
    expect(stdout).toHaveEntries([
      '[percy] created build #4: <<build-url>>',
      '[percy] percy has started.',
      '[percy] percy is ready.',
      '[percy] stopping percy...',
      '[percy] waiting for 0 snapshots to complete...',
      '[percy] done.',
      '[percy] finalized build #4: <<build-url>>',
    ])
  })
})
