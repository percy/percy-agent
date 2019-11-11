import expect from 'expect'

import {
  launch,
  run,
  setupApiProxy,
  setupDummyApp
} from './helpers'

describe('percy exec', () => {
  let proxy = setupApiProxy()

  it('warns when PERCY_TOKEN is missing', async () => {
    let [stdout, stderr] = await run('percy exec -- echo test', { PERCY_TOKEN: '' })
    expect(stderr).toHaveEntry('Warning: Skipping visual tests. PERCY_TOKEN was not provided.')
    expect(stdout).toHaveEntry('test')
  })

  it('creates and finalizes a new build', async () => {
    let [stdout, stderr] = await run('percy exec -- echo test')

    expect(stderr).toHaveLength(0)
    expect(stdout).toHaveEntries([
      '[percy] created build #4: <<build-url>>',
      'test',
      '[percy] finalized build #4: <<build-url>>'
    ])

    expect(proxy.requests['/builds']).toHaveLength(1)
    expect(proxy.requests['/builds'][0].method).toBe('POST')
    expect(proxy.requests['/builds'][0].body).toHaveProperty('data.attributes')
    expect(proxy.requests['/builds'][0].body).toHaveProperty('data.type', 'builds')
    expect(proxy.requests['/builds'][0].headers)
      .toHaveProperty('authorization', 'Token token=<<PERCY_TOKEN>>')
    expect(proxy.requests['/builds'][0].headers)
      .toHaveProperty('user-agent', expect.stringMatching(/\b(percy-agent\/[\n.]*\b)/))
    expect(proxy.requests['/builds/123/finalize']).toHaveLength(1)
  })

  it('finalizes the build when the process errors', async () => {
    let [stdout, stderr, code] = await run('percy exec -- node -e "throw new Error()"')

    expect(code).toBe(1)
    expect(stderr).toHaveEntry('Error')
    expect(stdout).toHaveEntries([
      '[percy] created build #4: <<build-url>>',
      '[percy] finalized build #4: <<build-url>>'
    ])

    expect(proxy.requests['/builds']).toHaveLength(1)
    expect(proxy.requests['/builds/123/finalize']).toHaveLength(1)
  })

  it('finalizes the build when the process is killed', async () => {
    // if the process does not terminate, this should time out mocha
    let percy = run('percy exec -- sleep 10')
    // wait a bit to give the server a chance to start
    await new Promise(r => setTimeout(r, 1500))
    // kill processes spawned by exec
    await run('pkill -2 sleep')

    // wait for stdio to close
    let [stdout, stderr] = await percy;

    expect(stderr).toHaveLength(0)
    expect(stdout).toHaveEntries([
      '[percy] created build #4: <<build-url>>',
      '[percy] finalized build #4: <<build-url>>'
    ])

    expect(proxy.requests['/builds']).toHaveLength(1)
    expect(proxy.requests['/builds/123/finalize']).toHaveLength(1)
  })

  describe('with snapshots', () => {
    let dummy = setupDummyApp()

    it('receives and finalizes snapshots', async () => {
      let [stdout, stderr] = await run('percy exec -- node ./tests/dummy/snapshot.js')

      expect(stderr).toHaveLength(0)
      expect(stdout).toHaveEntries([
        '[percy] created build #4: <<build-url>>',
        '[percy] snapshot taken: \'Home Page\'',
        '[percy] finalized build #4: <<build-url>>'
      ])

      expect(proxy.requests['/builds']).toHaveLength(1)
      expect(proxy.requests['/builds/123/snapshots']).toHaveLength(1)
      expect(proxy.requests['/builds/123/resources']).toHaveLength(3)
      expect(proxy.requests['/snapshots/456789/finalize']).toHaveLength(1)
      expect(proxy.requests['/builds/123/finalize']).toHaveLength(1)
    })

    it('uploads missing snapshot resources', async () => {
      let [stdout, stderr] = await run('percy exec -- node ./tests/dummy/snapshot.js')

      expect(proxy.requests['/builds/123/snapshots'][0].body)
        .toHaveProperty('data.relationships.resources.data', expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            attributes: expect.objectContaining({
              'resource-url': expect.stringMatching('/style.css')
            })
          }),
          expect.objectContaining({
            id: expect.any(String),
            attributes: expect.objectContaining({
              'resource-url': expect.stringContaining('http://localhost:9999'),
              'is-root': true
            })
          }),
          expect.objectContaining({
            id: expect.any(String),
            attributes: expect.objectContaining({
              'resource-url': expect.stringMatching(/\/percy\.\d+\.log/)
            })
          })
        ]))

      expect(proxy.requests['/builds/123/resources'][0].body)
        .toHaveProperty('data', expect.objectContaining({
          id: proxy.requests['/builds/123/snapshots'][0]
            .body.data.relationships.resources.data[0].id,
          attributes: expect.objectContaining({
            'base64-content': expect.any(String)
          })
        }))
      expect(proxy.requests['/builds/123/resources'][1].body)
        .toHaveProperty('data', expect.objectContaining({
          id: proxy.requests['/builds/123/snapshots'][0]
            .body.data.relationships.resources.data[1].id,
          attributes: expect.objectContaining({
            'base64-content': expect.any(String)
          })
        }))
      expect(proxy.requests['/builds/123/resources'][2].body)
        .toHaveProperty('data', expect.objectContaining({
          id: proxy.requests['/builds/123/snapshots'][0]
            .body.data.relationships.resources.data[2].id,
          attributes: expect.objectContaining({
            'base64-content': expect.any(String)
          })
        }))
    })
  })
})
