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
      await subject.start(port)

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          console.log(err)
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('responds to /percy/snapshots', async () => {
      await subject.start(port)

      chai.request(`http://${host}`)
        .post('/percy/snapshot')
        .end(function (err, res) {
          console.log(err)
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/json/)
          expect(JSON.stringify(res.body)).to.equal('{"message":"Response from percy-agent. Your user agent was: node-superagent/3.8.2"}')
        })
    })
  })

  describe('#stops', () => {
    it('stops a running server', async () => {
      await subject.start(port)
      await subject.stop()

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
