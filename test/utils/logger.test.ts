import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'
import { createFileLogger } from '../../src/utils/logger'
import { captureStdErr } from '../helpers/stdout'

describe('logger utils', () => {
  describe('createFileLogger', () => {
    const filesToCleanUp = [] as any

    afterEach(() => {
      if (filesToCleanUp) {
        filesToCleanUp.forEach((file: string) => existsSync(`${process.cwd()}/${file}`) && unlinkSync(`${process.cwd()}/${file}`))
      }
    })

    it('does not leak memory', async () => {
      const output = await captureStdErr(async () => {
        await new Promise((resolve) => {
          new Array(600).fill(0).forEach((item, index) => {
            const fileName = `test-file-${index}`
            createFileLogger(fileName)
            filesToCleanUp.push(fileName)
          })

          resolve()
        })
      })

      expect(output).to.equal('')
    })
  })
})
