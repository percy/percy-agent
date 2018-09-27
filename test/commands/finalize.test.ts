import * as chai from 'chai'
import * as sinon from 'sinon'
import {describe} from 'mocha'
import Finalize from '../../src/commands/finalize'
import {captureStdOut, captureStdErr} from '../helpers/stdout'
import BuildService from '../../src/services/build-service'
const expect = chai.expect

describe('Finalize', () => {
  let sandbox = sinon.createSandbox()
  afterEach(() => sandbox.restore())

  function BuildServiceStub(): BuildService {
    let buildService = BuildService.prototype as BuildService
    sandbox.stub(buildService, 'finalizeAll')

    let finalize = new Finalize([], '') as Finalize
    sandbox.stub(finalize, 'buildService').returns(buildService)

    return buildService
  }

  describe('#run', () => {
    it('finalizes a parallel build', async () => {
      let buildServiceStub = BuildServiceStub()
      let options = ['--all']

      let stdout = await captureStdOut(async () => {
        process.env.PERCY_PARALLEL_NONCE = '123'
        await Finalize.run(options)
      })

      expect(buildServiceStub.finalizeAll).to.calledOnce
      expect(stdout).to.contain('Finalized parallel build.')
    })

    it('requires PERCY_PARALLEL_NONCE', async () => {
      sandbox.stub(process, 'env').value({PERCY_PARALLEL_NONCE: '', PERCY_TOKEN: 'ABC'})

      let stderr = await captureStdErr(async () => {
        await Finalize.run([])
      })

      expect(stderr).to.contain('You must set PERCY_PARALLEL_NONCE')
    })
  })
})
