import {describe} from 'mocha'
import {expect} from 'chai'
import {captureStdOut} from '../helpers/stdout'
import BuildService from '../../src/services/build-service'
import * as nock from 'nock'

describe('BuildService', () => {
  let subject = new BuildService()

  const buildCreateResponse = require('../fixtures/build-create.json')
  const buildId = buildCreateResponse.data.id

  afterEach(() => nock.cleanAll())

  describe('#createBuild', () => {
    beforeEach(() => {
      nock('https://percy.io')
        .post('/api/v1/builds/')
        .reply(201, buildCreateResponse)
    })

    it('creates a build', async () => {
      let createdBuildId: number | null = null

      await captureStdOut(async () => {
        createdBuildId = await subject.create()
      })

      expect(createdBuildId).to.equal(+buildId)
    })
  })

  describe('#finalizeBuild', () => {
    beforeEach(() => {
      nock('https://percy.io')
        .post(`/api/v1/builds/${buildId}/finalize`)
        .reply(201, {data: {id: buildId}})
    })

    it('finalizes a build', async () => {
      let stdout = await captureStdOut(() => subject.finalize())
      expect(stdout).to.match(/\[percy\] finalized build #\d+: https:\/\/percy\.io\/test\/test\/builds\/\d+/)
    })
  })
})
