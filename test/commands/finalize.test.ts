import {expect, test} from '@oclif/test'

describe('finalize', () => {
  test
    .stub(process, 'env', {PERCY_TOKEN: 'abc'})
    .stderr()
    .command(['finalize'])
    .catch(err => expect(err.message).to.equal(
      'Missing required flag:\n' +
      ' -a, --all\n' +
      'See more help with --help'
    ))
    .it('requires -all flag')

  test
    .command(['finalize'])
    .exit(2)
    .it('exits with code 2')

  describe('--all', () => {
    test
      .stub(process, 'env', {PERCY_TOKEN: 'abc'})
      .stderr()
      .command(['finalize', '--all'])
      .catch(err => expect(err.message).to.equal(
        'You must set PERCY_PARALLEL_NONCE'
      ))
      .it('requires PERCY_PARALLEL_NONCE to be set')

    test
      .stub(process, 'env', {PERCY_TOKEN: 'abc'})
      .command(['finalize', '--all'])
      .exit(2)
      .it('exits with code 2')

    testWithNock()
      .stub(process, 'env', {PERCY_PARALLEL_NONCE: 'foo', PERCY_TOKEN: 'abc'})
      .stdout()
      .command(['finalize', '--all'])
      .do(output => expect(output.stdout).to.equal(
        '[percy] Finalized parallel build.\n' +
        '[percy] Visual diffs are now processing: http://mockurl\n'
      ))
      .it('finalizes a parallel build')
  })
})

function testWithNock() {
  return test
    .nock('https://percy.io', api => api
      .post('/api/v1/builds/123/finalize?all-shards=true')
      .reply(201)
    ).nock('https://percy.io', api => api
      .post('/api/v1/builds/')
      .reply(201, {data: {id: 123, attributes: {'build-number': '456', 'web-url': 'http://mockurl'}}})
  )
}
