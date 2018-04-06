import {describe} from 'mocha'
import HttpService from '../../src/services/http-service'
import * as chai from 'chai'
const expect = chai.expect
chai.use(require('chai-http'))

describe('HttpService', () => {
  let subject = new HttpService()
  let port = 34931
  let host = `127.0.0.1:${port}`

  afterEach(() => { subject.stop() })

  describe('#start', () => {
    it('starts serving src/public', async () => {
      subject.start(port)

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/javascript/)
        })
    })
  })

  describe('#stops', () => {
    it('stops a running server', async () => {
      subject.start(port)
      subject.stop()

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          expect(res).to.be.undefined
          expect(err).to.be.an('error')
            .with.property('message', `connect ECONNREFUSED ${host}`)
        })
    })
  })
})
