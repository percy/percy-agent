import * as chai from 'chai'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import {captureStdErr} from '../helpers/stdout'
import PercyCommand from '../../src/commands/percy-command'

const expect = chai.expect

describe('PercyCommand', () => {
  let sandbox = sinon.createSandbox()
  afterEach(() => sandbox.restore())

  describe('#percyEnvVarsMissing', () => {
    xit('errors when PERCY_TOKEN is missing', async () => {
      sandbox.stub(process, 'env').value({PERCY_TOKEN: ''})
      let subject = new PercyCommand([], '')

      let stderr = await captureStdErr(async () => {
        await subject.percyEnvVarsMissing()
      })

      expect(stderr).to.contain('You must set PERCY_TOKEN.')
    })
  })
})
