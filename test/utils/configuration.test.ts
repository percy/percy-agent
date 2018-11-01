import {expect} from 'chai'
import configuration from '../../src/utils/configuration'

describe('Configuration', () => {
  it('parses valid configuration', () => {
    const subject = configuration('test/support/.percy.yml')

    expect(subject.version).to.eql(1)
    expect(subject.snapshot.widths).to.eql([375, 1280])
    expect(subject.snapshot['min-height']).to.eql(1024)
    expect(subject.snapshot['enable-javascript']).to.eql(false)
  })

  it('gracefully handles a missing file', () => {
    const subject = configuration('test/support/.file-does-not-exist.yml')

    expect(subject).to.eql({})
  })
})
