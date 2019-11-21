import bodyParser from 'body-parser'
import express from 'express'

/**
 * The minimum API mocks necessary for agent to function
 */
const DEFAULT_MOCKS = {
  '/builds': () => [200, {
    data: {
      id: 123,
      attributes: {
        'build-number': 4,
        'web-url': '<<build-url>>'
      }
    }
  }],
  '/builds/:id/snapshots': ({ data }) => [200, {
    data: {
      id: 456789,
      relationships: {
        'missing-resources': {
          data: data.relationships.resources.data
        }
      }
    }
  }],
  '/builds/:id/resources': () => [200],
  '/builds/:id/finalize': () => [200],
  '/snapshots/:id/finalize': () => [200],
}

/**
 * Starts the mock API server, tracks requests, and sets up default mocks
 * defined above. Returns an object with a `mock` helper, `close` method, and
 * `requests` object. The `mock` helper will override default mocks or add new
 * ones, the `close` method will close the server, and the `requests` object
 * contains all requests made to the mock API indexed by path.
 *
 * @returns {object} `close()`, `mock()`, and `requests`
 */
export function createApiProxy() {
  let app = express()
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json({ type: 'application/vnd.api+json' }))
  let server = app.listen(8888)
  let close = () => server.close()

  // track all requests
  let requests = {}
  app.all('*', (req, res, next) => {
    let path = req.path.replace(/\/$/, '')
    requests[path] = requests[path] || []
    requests[path].push({ requestDate: new Date(), ...req })
    next()
  })

  // define & redefine mocks
  let mocks = {}
  let mock = (path, handle) => {
    // routes cannot be redefined
    if (!mocks[path]) {
      app.all(path, (req, res) => {
        let [code, body = {}] = mocks[path](req.body)
        res.status(code).json(body)
      })
    }

    // redefine the cached handler
    mocks[path] = handle
  }

  // define default mocks and return helpers
  Object.entries(DEFAULT_MOCKS).forEach(([path, handle]) => mock(path, handle))
  return { close, mock, requests }
}

/**
 * Hooks into Mocha's `beforeEach` and `afterEach` to create and close the API
 * proxy before and after each test. A local context is mutated and cleaned up
 * to handle memory leaks and returning helpers for use in tests.
 *
 * @returns {object} `close()`, `mock()`, and `requests`
 */
export default function setupApiProxy() {
  let proxy = {}

  beforeEach(() => {
    // mutate the local proxy so refs are current
    Object.assign(proxy, createApiProxy())
  })

  afterEach(() => {
    proxy.close()
    // mutate the local proxy to clean up refs
    Object.keys(proxy).forEach(k => delete proxy[k])
  })

  return proxy
}
