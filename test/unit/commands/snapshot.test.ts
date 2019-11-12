import { expect, test } from '@oclif/test'
import { describe } from 'mocha'
import * as sinon from 'sinon'
import Snapshot from '../../../src/commands/snapshot'
import { DEFAULT_CONFIGURATION } from '../../../src/configuration/configuration'
import { AgentService } from '../../../src/services/agent-service'
import StaticSnapshotService from '../../../src/services/static-snapshot-service'
import { captureStdErr, captureStdOut } from '../helpers/stdout'
import chai from '../support/chai'

describe('snapshot', () => {
  describe('#run', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
      // restore token to fake value
      process.env.PERCY_TOKEN = 'abc'
    })

    function AgentServiceStub(): AgentService {
      const agentService = AgentService.prototype as AgentService
      sandbox.stub(agentService, 'start')

      const start = new Snapshot([], '') as Snapshot
      sandbox.stub(start, 'agentService').returns(agentService)

      return agentService
    }

    function StaticSnapshotServiceStub(): StaticSnapshotService {
      const staticSnapshotService = StaticSnapshotService.prototype as StaticSnapshotService
      sandbox.stub(staticSnapshotService, 'snapshotAll')
      sandbox.stub(staticSnapshotService, 'start')

      return staticSnapshotService
    }

    it('starts the static snapshot service', async () => {
      const agentServiceStub = AgentServiceStub()
      const staticSnapshotServiceStub = StaticSnapshotServiceStub()

      const stdout = await captureStdOut(async () => {
        await Snapshot.run(['.'])
      })

      chai.expect(agentServiceStub.start).to.be.calledWith(DEFAULT_CONFIGURATION)
      chai.expect(staticSnapshotServiceStub.start).to.have.callCount(1)
      chai.expect(staticSnapshotServiceStub.snapshotAll).to.have.callCount(1)
      chai.expect(stdout).to.match(/\[percy\] percy has started./)
    })

    it('warns about PERCY_TOKEN not being set and exits gracefully', async () => {
      process.env.PERCY_TOKEN = ''

      const stderr = await captureStdErr(async () => {
        await Snapshot.run(['.'])
      })

      chai.expect(stderr).to.match(/Warning: Skipping visual tests\. PERCY_TOKEN was not provided\./)
    })
  })
})
