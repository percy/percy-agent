import { unlinkSync } from 'fs'
// @ts-ignore
import * as maxListenersExceededWarning from 'max-listeners-exceeded-warning'
import { createFileLogger } from '../../src/utils/logger'

// this will throw an error if a memeory leak is detected
maxListenersExceededWarning()

describe('logger utils', () => {
  describe('createFileLogger', () => {
    const filesToCleanUp = [] as any

    afterEach(() => {
      if (filesToCleanUp) {
        filesToCleanUp.forEach((file: string) => unlinkSync(`${process.cwd()}/${file}`))
      }
    })

    it('does not leak memory', () => {
      const loop = new Array(600).fill(0)

      loop.forEach((item, index) => {
        const fileName = `test-file-${index}`
        createFileLogger(fileName)
        filesToCleanUp.push(fileName)
      })
    })
  })
})
