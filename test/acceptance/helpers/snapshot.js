import http from 'http'
import puppeteer from 'puppeteer'

/**
 * Similar to our Puppeteer or PercyScript SDKs - uses a Puppeteer page to
 * inject agent client code and capture the DOM, and sends that DOM with `name`
 * and `options` to agent's running server.
 *
 * Does not use functions defined in sdk-utils to avoid compiling and to allow
 * errors to bubble up through our tests. Returns the captured DOM string for
 * assertions within tests.
 *
 * @param {object} page - Puppeteer page objectg
 * @param {string} name - Snapshot name
 * @param {object} options - Snapshot options
 * @returns {string} The captured DOM string
 */
async function snapshot(page, name, options = {}) {
  await page.addScriptTag({
    url: 'http://localhost:5338/percy-agent.js'
  })

  let dom = await page.evaluate(options => {
    return new PercyAgent({ handleAgentCommunication: false })
      .domSnapshot(document, options)
  }, options)

  let data = JSON.stringify({
    name,
    url: page.url(),
    domSnapshot: dom,
    clientInfo: 'acceptance-micro-sdk',
    ...options
  })

  let req = http.request({
    port: 5338,
    method: 'POST',
    path: '/percy/snapshot',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  })

  req.write(data)
  req.end()

  return dom
}

/**
 * Launches a Puppeteer browser, creates a new page, and calls the provided
 * `callback` with the page object and bound snapshot helper. Will always close
 * the browser even if the callback throws an error.
 *
 * @param {function} callback - Callback to call for snapshotting
 * @returns {any} The return value of the provided `callback`
 */
export default async function launch(callback) {
  let browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--single-process',
      '--disable-dev-profile'
    ]
  })

  let page = await browser.newPage()
  // required for `addScriptTag` in the snapshot helper
  await page.setBypassCSP(true)

  try {
    return await callback(page, snapshot.bind(null, page))
  } finally {
    await browser.close()
  }
}
