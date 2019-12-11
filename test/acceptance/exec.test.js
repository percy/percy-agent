import { execSync } from 'child_process'
import expect from 'expect'
import { when } from 'interactor.js'

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

  it('logs a message when missing a command', async () => {
    let [stdout, stderr, code] = await run('percy exec')

    expect(code).toEqual(1)
    expect(stderr).toHaveLength(0)
    expect(stdout).toHaveEntries([
      '[percy] You must supply a command to run after --',
      '[percy] Example:',
      '[percy] $ percy exec -- echo "run your test suite"'
    ])
  })

  it('errors when the command cannot be found', async () => {
    let [stdout, stderr, code] = await run('percy exec -- foobar')

    expect(code).toEqual(127)
    expect(stderr).toHaveEntry('[percy] Error: command not found "foobar"')
    expect(stdout).toHaveLength(0)
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
    // kill the process spawned by exec as soon as it runs
    await when(() => execSync('pkill -2 sleep'), 3000)

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

  it('logs finalization errors', async () => {
    proxy.mock('/builds/:id/finalize', () => [404, { success: false }])

    let [stdout, stderr] = await run('percy exec -- echo test')

    expect(stdout).toHaveEntry('[percy] created build #4: <<build-url>>')
    expect(stderr).toHaveEntry('[percy] StatusCodeError 404 - {"success":false}')
    expect(stdout).not.toHaveEntry('[percy] finalized build #4: <<build-url>>')
  })

  describe('with snapshots', () => {
    let dummy = setupDummyApp()

    it('receives and finalizes snapshots', async () => {
      let [stdout, stderr] = await run('percy exec -- node ./test/acceptance/dummy/snapshot.js')

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
      let [stdout, stderr] = await run('percy exec -- node ./test/acceptance/dummy/snapshot.js')

      // expect each resource is associated with the snapshot
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

      let resources = proxy.requests['/builds/123/snapshots'][0]
        .body.data.relationships.resources.data

      // expect a request to upload each resource (unordered)
      expect(proxy.requests['/builds/123/resources'])
        .toEqual(expect.arrayContaining(resources.map(resource => (
          expect.objectContaining({
            body: expect.objectContaining({
              data: expect.objectContaining({
                id: resource.id,
                attributes: expect.objectContaining({
                  'base64-content': expect.any(String)
                })
              })
            })
          })
        ))))
    })
  })
})
