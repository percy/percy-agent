import {expect, test} from '@oclif/test'

describe('stop', () => {
  test
  .stdout()
  .command(['start'])
  .command(['stop'])
  .it('runs stop', ctx => {
    expect(ctx.stdout).to.contain('gracefully stopping percy-agent')
    expect(ctx.stdout).to.contain('percy-agent has stopped.')
  })

  test
  .stdout()
  .command(['start'])
  .command(['stop', '--force'])
  .it('runs stop --force', ctx => {
    expect(ctx.stdout).to.contain('forcefully stopping percy-agent')
    expect(ctx.stdout).to.contain('percy-agent has stopped.')
  })

  test
  .stdout()
  .command(['stop'])
  .command(['stop', '--force'])
  .it('runs stop, even if already stopped', ctx => {
    expect(ctx.stdout).to.contain('percy-agent is already stopped')
  })
})
