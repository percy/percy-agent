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
    console.log('--------------')
    console.log(filename)
    console.log('--------------')
    expect(filename.startsWith('/')).to.eq(true)
  })
})
