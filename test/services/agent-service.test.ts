import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'
import AgentService from '../../src/services/agent-service'
import * as chai from 'chai'
const expect = chai.expect
chai.use(require('chai-http'))

describe('AgentService', () => {
  let subject = new AgentService()
  let port = 34931
  let host = `127.0.0.1:${port}`

  afterEach(async () => {
    await captureStdOut(() => subject.stop())
  })

  describe('#start', () => {
    it('starts serving dist/public on supplied port', async () => {
      await captureStdOut(() => subject.start(port))

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          console.log(err)
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res).to.have.header('content-type', /application\/javascript/)
        })
    })

    it('logs to stdout that it created a build', async () => {
      let stdout = await captureStdOut(() => subject.start(port))
      expect(stdout).to.match(/\[info\] BuildService#createBuild\[Build \d+\]\: created/)
    })

    // it('responds to /percy/snapshots', async () => {
    //   await subject.start(port)

    //   chai.request(`http://${host}`)
    //     .post('/percy/snapshot')
    //     .end(function (err, res) {
    //       console.log(err)
    //       expect(err).to.be.null
    //       expect(res).to.have.status(200)
    //       expect(res).to.have.header('content-type', /application\/json/)
    //       expect(JSON.stringify(res.body)).to.equal('{"message":"Response from percy-agent. Your user agent was: node-superagent/3.8.2"}')
    //     })
    // })
  })

  describe('#stop', () => {
    it('stops serving dist/public on supplied port', async () => {
      await captureStdOut(async () => {
        await subject.start(port)
        await subject.stop()
      })

      chai.request(`http://${host}`)
        .get('/percy-agent.js')
        .end(function (err, res) {
          expect(res).to.be.undefined
          expect(err).to.be.an('error')
            .with.property('message', `connect ECONNREFUSED ${host}`)
        })
    })

    it('logs to stdout that it finalized a build', async () => {
      await captureStdOut(() => subject.start(port))

      let stdout = await captureStdOut(async () => {
        await subject.stop()
      })

      expect(stdout).to.match(/\[info\] BuildService#createBuild\[Build \d+\]\: finalized/)
    })
  })
})
