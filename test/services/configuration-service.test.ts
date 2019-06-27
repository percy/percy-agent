import { expect } from 'chai'
import { DEFAULT_CONFIGURATION } from '../../src/configuration/configuration'
import ConfigurationService from '../../src/services/configuration-service'
import { captureStdErr } from '../helpers/stdout'

describe('ConfigurationService', () => {
  describe('#configuration', () => {
    it('returns default configuration by default', () => {
      const subject = new ConfigurationService().configuration
      expect(subject).to.eql(DEFAULT_CONFIGURATION)
    })
  })

  describe('#applyFile', () => {
    it('parses valid configuration', () => {
      const subject = new ConfigurationService().applyFile('test/support/.percy.yml')

      expect(subject.version).to.eql(1)
      expect(subject.snapshot.widths).to.eql([375, 1280])
      expect(subject.snapshot['min-height']).to.eql(1024)
      expect(subject['static-snapshots'].path).to.eql('_site/')
      expect(subject['static-snapshots'].port).to.eql(9999)
      expect(subject['static-snapshots']['base-url']).to.eql('/blog/')
      expect(subject['static-snapshots']['snapshot-files']).to.eql('**/*.html')
      expect(subject['static-snapshots']['ignore-files']).to.eql('**/*.htm')
      expect(subject.agent.port).to.eql(1111)
      expect(subject.agent['asset-discovery']['network-idle-timeout']).to.eql(50)
      expect(subject.agent['asset-discovery']['page-pool-size-min']).to.eql(5)
      expect(subject.agent['asset-discovery']['page-pool-size-max']).to.eql(20)
    })

    it('gracefully falls back to default configuration when file does not exist', () => {
      const subject = new ConfigurationService().applyFile('test/support/.file-does-not-exist.yml')
      expect(subject).to.eql(DEFAULT_CONFIGURATION)
    })
  })

  describe('#applyFlags', () => {
    it('applies flags', () => {
      const flags = {
        'network-idle-timeout': 51,
        'base-url': '/flag/',
        'snapshot-files': 'flags/*.html',
        'ignore-files': 'ignore-flags/*.html',
      }
      const subject = new ConfigurationService('test/support/.percy.yml').applyFlags(flags)

      expect(subject['static-snapshots']['base-url']).to.eql('/flag/')
      expect(subject['static-snapshots']['snapshot-files']).to.eql('flags/*.html')
      expect(subject['static-snapshots']['ignore-files']).to.eql('ignore-flags/*.html')
      expect(subject.agent['asset-discovery']['network-idle-timeout']).to.eql(51)
    })
  })

  describe('#applyArgs', () => {
    it('applies args', () => {
      const args = {
        snapshotDirectory: '/from/arg',
      }
      const subject = new ConfigurationService('test/support/.percy.yml').applyArgs(args)

      expect(subject['static-snapshots'].path).to.eql('/from/arg')
    })
  })
})
