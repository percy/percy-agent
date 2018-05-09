import {describe} from 'mocha'
import ResourceService from '../../src/services/resource-service'
import chai from '../support/chai'
const expect = chai.expect

describe('RequestService', () => {
  let subject = new ResourceService()
  let request = 'https://percy.io/logo.svg'
  let copyFileSha = 'b12e0d83ce2357d80b89c57694814d0a3abdaf8c40724f2049af8b7f01b7812b'
  let copyFilePath = `./test/fixtures/${copyFileSha}`

  describe('#createResourcesFromLocalCopies', () => {
    let localCopies = new Map([[request, copyFilePath]])

    it('creates resources from files', async () => {
      let resources = await subject.createResourcesFromLocalCopies(localCopies)

      expect(resources[0]).to.include({
        mimetype: undefined,
        isRoot: undefined,
        resourceUrl: '/logo.svg',
        sha: copyFileSha
      })
    })
  })

  describe('#createResourceFromFile', () => {
    it('creates a resource from files', async () => {
      let resource = await subject.createResourceFromFile(request, copyFilePath)

      expect(resource).to.include({
        mimetype: undefined,
        isRoot: undefined,
        resourceUrl: '/logo.svg',
        sha: copyFileSha
      })
    })
  })
})
