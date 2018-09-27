import * as chai from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import Finalize from '../../src/commands/finalize'
import {captureStdOut} from '../helpers/stdout'
import BuildService from '../../src/services/build-service'
const expect = chai.expect

describe('Finalize', () => {
  let sandbox = sinon.createSandbox()

  function BuildServiceStub(): BuildService {
    let buildService = BuildService.prototype as BuildService
    sandbox.stub(buildService, 'finalizeAll')

    let finalize = new Finalize([], '') as Finalize
    sandbox.stub(finalize, 'buildService').returns(buildService)

    return buildService
  }

  afterEach(() => {
    nock.cleanAll()
    sandbox.restore()
  })

  describe('#run', () => {
    it('finalizes a parallel build', async () => {
      let buildServiceStub = BuildServiceStub()

      let options = ['--all']

      let stdout = await captureStdOut(async () => {
        process.env.PERCY_PARALLEL_NONCE = '123'
        await Finalize.run(options)
      })

      expect(buildServiceStub.finalizeAll).to.calledOnce
      console.log('--------')
      console.log(stdout)
      console.log('--------')
      expect(stdout).to.contain('\[percy\] Finalized parallel build.')
    })
  })
})
