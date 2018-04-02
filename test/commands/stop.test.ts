import {expect, test} from '@oclif/test'

describe('stop', () => {
  test
  .stdout()
  .command(['stop'])
  .it('runs stop', ctx => {
    expect(ctx.stdout).to.contain("gracefully stopping percy-agent...")
    expect(ctx.stdout).to.contain("percy-agent has stopped.")
  })

  test
  .stdout()
  .command(['stop', '--force'])
  .it('runs stop --force', ctx => {
    expect(ctx.stdout).to.contain("percy-agent has stopped.")
  })
})
