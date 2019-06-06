import {expect} from 'chai'
import configuration from '../../src/configuration/configuration'

describe('Configuration', () => {
  it('parses valid configuration', () => {
    const subject = configuration('test/support/.percy.yml')

    expect(subject.version).to.eql(1)
    expect(subject.snapshot.widths).to.eql([375, 1280])
    expect(subject.snapshot['min-height']).to.eql(1024)
    expect(subject['static-snapshots']['base-url']).to.eql('/blog/')
    expect(subject['static-snapshots']['snapshot-files']).to.eql('**/*.html')
    expect(subject['static-snapshots']['ignore-files']).to.eql('**/*.htm')
  })

  it('gracefully handles a missing file', () => {
    const subject = configuration('test/support/.file-does-not-exist.yml')

    expect(subject).to.eql({'version': 1.0, 'snapshot': {}, 'static-snapshots': {}})
  })
})
