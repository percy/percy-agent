import {expect} from 'chai'
import * as fs from 'fs'
import { agentJsFilename} from '../../src/utils/sdk-utils'

describe('agentJsFilename', () => {
  it('returns a valid filename', () => {
    const filename = agentJsFilename()
    expect(fs.existsSync(filename)).to.eq(true)
  })

  it('returns an absolute filename', () => {
    const filename = agentJsFilename()
    // Allows for Linux /foo and Windows C:\ paths
    expect(filename).to.match(/^(\/|[A-Za-z]:\\)/)
  })
})
