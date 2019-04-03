import * as chai from 'chai'
import * as sinon from 'sinon'
import Snapshot from '../../src/commands/snapshot'
import AgentService from '../../src/services/agent-service'
import StaticSnapshotService from '../../src/services/static-snapshot-service'
import {describe} from 'mocha'
import {captureStdOut} from '../helpers/stdout'

import {expect, test} from '@oclif/test'

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
      sandbox.stub(staticSnapshotService, 'snapshot')

      const snapshot = new Snapshot([], '') as Snapshot
      sandbox.stub(snapshot, 'staticSnapshotService').returns(staticSnapshotService)

      return staticSnapshotService
    }

    it('starts the static snapshot service', async () => {
      const expectedAgentOptions = {networkIdleTimeout: 50, port: 5338}
      const expectedSnapshotOptions = {
        port: 5339,
        staticAssetDirectory: './dummy-test-dir',
        widths: [1280],
        baseUrl: '/',
        snapshotCaptureRegex: '\.(html|htm)$',
        snapshotIgnoreRegex: undefined,
      }

      const agentServiceStub = AgentServiceStub()
      const staticSnapshotServiceStub = StaticSnapshotServiceStub()

      const stdout = await captureStdOut(async () => {
        await Snapshot.run(['./dummy-test-dir'])
      })

      chai.expect(agentServiceStub.start).to.be.calledWith(expectedAgentOptions)
      chai.expect(staticSnapshotServiceStub.snapshot).to.be.calledWith(expectedSnapshotOptions)
      chai.expect(stdout).to.match(/\[percy\] percy has started./)
    })

    it('passes the correct args to the static snapshot service', async () => {
      const port = 5338

      const expectedAgentOptions = {networkIdleTimeout: 50, port}
      const expectedSnapshotOptions = {
        port: port + 1,
        staticAssetDirectory: './dummy-test-dir',
        widths: [1280],
        baseUrl: '/',
        snapshotCaptureRegex: 'custom-capture',
        snapshotIgnoreRegex: 'custom-ignore',
      }

      const snapshotCommandOptions = [
        '-p',
        port.toString(),
        '-w',
        expectedSnapshotOptions.widths.toString(),
        '-b',
        expectedSnapshotOptions.baseUrl,
        '-c',
        expectedSnapshotOptions.snapshotCaptureRegex,
        '-i',
        expectedSnapshotOptions.snapshotIgnoreRegex,
        expectedSnapshotOptions.staticAssetDirectory,
      ]

      const agentServiceStub = AgentServiceStub()
      const staticSnapshotServiceStub = StaticSnapshotServiceStub()

      const stdout = await captureStdOut(async () => {
        await Snapshot.run(snapshotCommandOptions)
      })

      chai.expect(stdout).to.match(/\[percy\] percy has started./)
      chai.expect(staticSnapshotServiceStub.snapshot).to.be.calledWith(expectedSnapshotOptions)
      chai.expect(agentServiceStub.start).to.be.calledWith(expectedAgentOptions)
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
