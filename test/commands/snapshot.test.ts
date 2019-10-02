import {expect, test} from '@oclif/test'
import * as chai from 'chai'
import {describe} from 'mocha'
import * as sinon from 'sinon'
import Snapshot from '../../src/commands/snapshot'
import { DEFAULT_CONFIGURATION } from '../../src/configuration/configuration'
import {AgentService} from '../../src/services/agent-service'
import StaticSnapshotService from '../../src/services/static-snapshot-service'
import {captureStdOut} from '../helpers/stdout'

describe('snapshot', () => {
  describe('#run', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
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
  })

  describe('snapshot command', () => {
    test
      .stub(process, 'env', {PERCY_TOKEN: ''})
      .stderr()
      .command(['snapshot', './test_dir'])
      .exit(0)
      .do((output) => expect(output.stderr).to.contain(
        'Warning: Skipping visual tests. PERCY_TOKEN was not provided.',
      ))
      .it('warns about PERCY_TOKEN not being set and exits gracefully')

    test
      .env({PERCY_TOKEN: 'abc'})
      .command(['snapshot'])
      .exit(2)
      .it('exits when the asset directory arg is missing')
  })
})
