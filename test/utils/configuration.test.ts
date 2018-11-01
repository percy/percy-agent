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

  it('gracefully handles missing data', () => {
    const subject = configuration('test/support/.percy-invalid.yml')

    // this is ok because we just use this configuration as one of the fallbacks
    // in a chain. snapshot specific options -> agent configuration -> default values
    expect(subject.snapshot).to.eql(undefined)
  })
})
