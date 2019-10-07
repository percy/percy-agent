import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { DEFAULT_CONFIGURATION } from '../../src/configuration/configuration'
import config, { explorer } from '../../src/utils/configuration'

function dedent(str: string) {
  const indent = str.match(/ +/g)![0].length
  return str.replace(new RegExp(`\n {${indent}}`, 'g'), '\n').trim()
}

describe('configuration', () => {
  let configfiles: string[]

  // helper to create a config files and cleanup on `afterEach`
  function mkconfig(filename: string, contents: string) {
    const filepath = path.join(process.cwd(), filename)
    fs.writeFileSync(filepath, dedent(contents))
    configfiles.push(filepath)
  }

  beforeEach(() => {
    // clear caches for creating & removing files during testing
    explorer.clearCaches()
    configfiles = []
  })

  afterEach(() => {
    // clean up any created config files
    configfiles.forEach((file) => {
      fs.unlinkSync(file)
    })
  })

  it('returns the default configuration', () => {
    expect(config({})).to.deep.equal(DEFAULT_CONFIGURATION)
  })

  it('automatically loads overrides from a `.percy.yml` config file', () => {
    mkconfig('.percy.yml', `
      version: 1
      snapshot:
        widths: [320, 1200]
        enable-javascript: true
      agent:
        asset-discovery:
          request-headers:
            Authorization: 'Basic abc123='
   `)

    expect(config({})).to.deep.equal({
      ...DEFAULT_CONFIGURATION,
      snapshot: {
        ...DEFAULT_CONFIGURATION.snapshot,
        'widths': [320, 1200],
        'enable-javascript': true,
      },
      agent: {
        ...DEFAULT_CONFIGURATION.agent,
        'asset-discovery': {
          ...DEFAULT_CONFIGURATION.agent['asset-discovery'],
          'request-headers': {
            Authorization: 'Basic abc123=',
          },
        },
      },
    })
  })

  it('overrides defaults and config file options with flags and args', () => {
    mkconfig('.percy.json', `{
      "version": 1,
      "snapshot": {
        "widths": [800]
      },
      "static-snapshots": {
        "path": "_wrong/",
        "ignore-files": "**/*.ignore.*"
      }
   }`)

    const flags = { 'snapshot-files': '**/*.snapshot.html' }
    const args = { snapshotDirectory: '_site/' }

    expect(config(flags, args)).to.deep.equal({
      ...DEFAULT_CONFIGURATION,
      'snapshot': {
        ...DEFAULT_CONFIGURATION.snapshot,
        widths: [800],
      },
      'static-snapshots': {
        ...DEFAULT_CONFIGURATION['static-snapshots'],
        'path': '_site/',
        'ignore-files': '**/*.ignore.*',
        'snapshot-files': '**/*.snapshot.html',
      },
    })
  })
})
