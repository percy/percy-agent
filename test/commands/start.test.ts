import {expect, test} from '@oclif/test'

describe('start', () => {
  test
    .stdout()
    .command(['start'])
    .it('runs start', ctx => {
      expect(ctx.stdout).to.contain('')
    })

  test
    .stdout()
    .command(['start', '--port', '55000'])
    .it('runs start --port 55000', ctx => {
      expect(ctx.stdout).to.contain('')
    })
})
