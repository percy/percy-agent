import express from 'express'
import basicAuth from 'express-basic-auth'
import path from 'path'

/**
 * Creates an express server to serve a static dummy app with optional basic
 * authentication support.
 *
 * @param {object} [options={}] - Options used in creating the express server
 * @param {object} [options.auth] - Pairs of username and passwords
 * @returns {object} An object containing app and server references
 */
function createDummyApp({ auth } = {}) {
  let app = express()
  let server = app.listen(9999)
  let staticMiddleware = express.static(path.join(__dirname, '../dummy'))

  app.use(staticMiddleware)

  if (auth != null) {
    let authMiddleware = basicAuth({ challenge: true, users: auth })
    app.use('/protected', authMiddleware, staticMiddleware)
  }

  return { app, server }
}

/**
 * Hooks into Mocha's `beforeEach` and `afterEach` to create and close the dummy
 * server before and after each test. A local context is mutated and cleaned up
 * to handle memory leaks and returning helpers for use in tests.
 *
 * @returns {object} An object containing app and server references
 */
export default function setupDummyApp(options) {
  let dummy = {}

  beforeEach(() => {
    // mutate the local context so refs are current
    Object.assign(dummy, createDummyApp(options))
  })

  afterEach(() => {
    dummy.server.close()
    // mutate the local context to clean up refs
    Object.keys(dummy).forEach(k => delete dummy[k])
  })

  return dummy
}
