import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'
import { createFileLogger } from '../../../src/utils/logger'
import { captureStdErr } from '../helpers/stdout'

describe('logger utils', () => {
  describe('createFileLogger', () => {
    const filesToCleanUp = [] as any

    afterEach(() => {
      if (filesToCleanUp) {
        filesToCleanUp.forEach((file: string) => {
          const filePath = `${process.cwd()}/${file}`
          if (!existsSync(filePath)) { return }

          unlinkSync(filePath)
        })
      }
    })

    it('does not leak memory', async () => {
      const output = await captureStdErr(() => {
        for (let index = 0; index < 600; index++) {
          const fileName = `test-file-${index}`
          createFileLogger(fileName)
          filesToCleanUp.push(fileName)
        }
      })

      expect(output).to.equal('')
    })
  })
})
