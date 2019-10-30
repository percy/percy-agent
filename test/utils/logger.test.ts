import { expect } from 'chai'
import { unlinkSync } from 'fs'
import { createFileLogger } from '../../src/utils/logger'

describe.only('logger utils', () => {
  describe('createFileLogger', () => {
    const filesToCleanUp = [] as any

    afterEach(() => {
      if (filesToCleanUp) {
        filesToCleanUp.forEach((file: string) => unlinkSync(`${process.cwd()}/${file}`))
      }
    })

    it('does not leak memory', () => {
      const loop = new Array(400).fill(0)

      loop.forEach((item, index) => {
        const fileName = `test-file-${index}`
        createFileLogger(fileName)
        filesToCleanUp.push(fileName)
      })
    })
  })
})
