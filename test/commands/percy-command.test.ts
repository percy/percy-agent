import {expect, test} from '@oclif/test'

describe('percy-command', () => {
  test
    .stub(process, 'env', {PERCY_TOKEN: ''})
    .stderr()
    .command(['percy-command'])
    .do((output) => expect(output.stderr).to.contain(
      'Warning: Skipping visual tests. PERCY_TOKEN was not provided.',
    ))
    .it('warns about PERCY_TOKEN to be set')

  test
    .stub(process, 'env', {PERCY_ENABLE: '0', PERCY_TOKEN: ''})
    .stderr()
    .command(['percy-command'])
    .do((output) => expect(output.stderr).to.contain(
      'Warning: Skipping visual tests. PERCY_TOKEN was not provided.',
    ))
    .it('warns about PERCY_TOKEN to be set')

  test
    .stub(process, 'env', {PERCY_ENABLE: '0', PERCY_TOKEN: 'ABC'})
    .stderr()
    .command(['percy-command'])
    .do((output) => expect(output.stderr).to.eql(''))
    .it('outputs no errors')
})
