import {describe} from 'mocha'
import {expect} from 'chai'
import {captureStdOut} from '../helpers/stdout'
import BuildService from '../../src/services/build-service'
import * as nock from 'nock'

describe('BuildService', () => {
  let subject = new BuildService()
  const buildId = 1

  describe('#createBuild', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .post('/api/v1/projects/test/test/builds/')
        .reply(201, {data: {id: buildId}})
    })

    it('creates a build', async () => {
      let createdBuildId: number | null = null

      await captureStdOut(async () => {
        createdBuildId = await subject.createBuild()
      })

      expect(createdBuildId).to.equal(buildId)
    })
  })

  describe('#finalizeBuild', () => {
    beforeEach(async () => {
      nock('https://percy.io')
        .post(`/api/v1/builds/${buildId}/finalize`)
        .reply(201, {data: {id: buildId}})
    })

    it('finalizes a build', async () => {
      let stdout = await captureStdOut(() => subject.finalizeBuild(buildId))
      expect(stdout).to.contain(`[info] BuildService#createBuild[Build ${buildId}]: finalized`)
    })
  })
})
