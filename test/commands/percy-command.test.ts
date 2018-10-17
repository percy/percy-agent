import {expect, test} from '@oclif/test'

describe('percy-command', () => {
  test
    .stub(process, 'env', {PERCY_TOKEN: ''})
    .stderr()
    .command(['percy-command'])
    .catch(err => expect(err.message).to.equal(
      'You must set PERCY_TOKEN'
    ))
    .it('requires PERCY_TOKEN to be set')

  test
    .stub(process, 'env', {PERCY_TOKEN: ''})
    .command(['percy-command'])
    .exit(1)
    .it('exits with code 1')
})
