import {expect, test} from '@oclif/test'
import Start from '../../src/commands/start'
import Stop from '../../src/commands/stop'

describe('stop', () => {
  Start.run([])

  test
  .stdout()
  .command(['stop'])
  .it('runs stop', ctx => {
    expect(ctx.stdout).to.contain('gracefully stopping percy-agent')
    expect(ctx.stdout).to.contain('percy-agent has stopped.')
  })

  Start.run([]).then(() => {
    test
      .stdout()
      .command(['stop', '--force'])
      .it('runs stop --force', ctx => {
        expect(ctx.stdout).to.contain('forcefully stopping percy-agent')
        expect(ctx.stdout).to.contain('percy-agent has stopped.')
      })
  })

  Stop.run([])

  test
  .stdout()
  .command(['stop'])
  .it('runs stop', ctx => {
    expect(ctx.stdout).to.contain('percy-agent is already stopped.')
  })
})
