import * as cheerio from 'cheerio'
import * as express from 'express'
import * as basicAuth from 'express-basic-auth'
import { Server } from 'http'
import { describe } from 'mocha'
import * as puppeteer from 'puppeteer'
import { agentJsFilename, postSnapshot } from '../../src/utils/sdk-utils'
import chai from '../unit/support/chai'

const expect = chai.expect

// Use this instead of importing PercyAgent - we only want the browserified version
declare var PercyAgent: any

async function snapshot(page: puppeteer.Page, name: string, options: any = {}) {
  const nodeName = `node-${process.version.replace('v', '').split('.')[0]} - ${name}`
  await page.addScriptTag({path: agentJsFilename()})

  const domSnapshot = await page.evaluate((name: string, options: any) => {
    const percyAgentClient = new PercyAgent({ handleAgentCommunication: false })

    return percyAgentClient.snapshot(name, options)
  }, nodeName, options)

  await postSnapshot({
    name: nodeName,
    domSnapshot,
    url: page.url(),
    clientInfo: 'integration-microSDK',
    ...options,
  })

  return domSnapshot
}

describe('Integration test', () => {
  let browser: puppeteer.Browser
  let page: puppeteer.Page

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--single-process',
        '--disable-dev-profile',
      ],
    })
    page = await browser.newPage()

    // Necessary for some of the live sites examples.
    page.setBypassCSP(true)
  })

  after(async () => {
    browser.close()
  })

  describe('on live sites', () => {
    it('snapshots a simple site', async () => {
      await page.goto('http://example.com')
      const domSnapshot = await snapshot(page, 'Example.com snapshot')
      expect(domSnapshot).contains('Example Domain')
    })

    it('snapshots an HTTPS, CORS, HSTS, & CSP site', async () => {
      await page.goto('https://sdk-test.percy.dev')
      const domSnapshot = await snapshot(page, 'SDK example page snapshot')
      expect(domSnapshot).contains('SDK Test Website')
    })

    it('snapshots an invalid HTTPS site', async () => {
      // maintained by the chrome team
      await page.goto('https://self-signed.badssl.com/')
      const domSnapshot = await snapshot(page, 'Invalid HTTPS')
      expect(domSnapshot).contains('badssl.com')
    })

    it('snapshots a complex website with CSSOM', async () => {
      await page.goto('https://buildkite.com/')
      const domSnapshot = await snapshot(page, 'Buildkite snapshot')
      expect(domSnapshot).contains('Buildkite')
    })

    it('snapshots a site with redirected assets', async () => {
      await page.goto('https://sdk-test.percy.dev/redirects/')
      await page.waitForSelector('h2')
      const domSnapshot = await snapshot(page, 'Redirects snapshot')

      // This will fail the test if the redirected JS fails to work
      expect(domSnapshot).contains('Snapshot worked')
    })

    it('falls back to default widths when nothing is passed', async () => {
      await page.goto('https://sdk-test.percy.dev/')

      await snapshot(page, 'Empty widths array', { widths: [] })
    })

  })

  describe('on local test cases', () => {
    const testCaseDir = `${__dirname}/testcases`
    const PORT = 8000

    let app: express.Application
    let server: Server

    before(() => {
      app = express()
      app.use(express.static(testCaseDir))
      server = app.listen(PORT)
    })

    after(() => {
      server.close()
    })

    it('applies Percy specific CSS', async () => {
      await page.goto(`http://localhost:${PORT}/percy-specific-css.html`)
      await snapshot(page, 'Percy Specific CSS', {
        percyCSS: `.percy-only-css-snapshot {
                     height: 100px;
                     width: 100px;
                     background-color: purple;
                  }`,
      })
    })

    describe('protected resources', () => {
      const username = 'test'
      const password = 'test'

      before(async () => {
        app.get('/auth/redirected.png', (_, res) => {
          res.redirect(301, '/auth/fairy-emojione.png')
        })

        app.use(
          '/auth',
          basicAuth({ users: { [username]: password }, challenge: true }),
          express.static(testCaseDir),
        )

        await page.authenticate({ username, password })
        await page.goto(`http://localhost:${PORT}/auth/protected-with-basic-auth.html`)
      })

      it('does not capture protected resources without the correct headers', async () => {
        // the snapshot should show missing resources
        await snapshot(page, 'Protected assets')
      })

      it('captures protected resources with the correct headers', async () => {
        await snapshot(page, 'Captured protected assets', {
          requestHeaders: {
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          },
        })
      })
    })

    describe('large resources', () => {
      it('snapshots large DOM', async () => {
        await page.goto(`http://localhost:${PORT}/exceeds-dom-snapshot-size-limit.html`)

        await snapshot(page, 'Large DOM snapshot')
      })

      it('snapshots pages with large assets', async () => {
        await page.goto(`http://localhost:${PORT}/exceeds-resource-size-limit.html`)

        await snapshot(page, 'Large assets snapshot')
      })
    })

    describe('responsive assets', () => {
      it('properly captures all assets', async () => {
        await page.goto(`http://localhost:${PORT}/responsive-assets.html`)

        await snapshot(page, 'Responsive assets')
      })
    })

    describe('alternate hostnames', () => {
      it('properly captures assets from alternate hostnames', async () => {
        await page.goto(`http://localhost:${PORT}/alternate-hostname.html`)

        await snapshot(page, 'Alternate hostname')
      })
    })

    describe('stabilizes DOM', () => {
      before(async () => {
        await page.goto(`http://localhost:${PORT}/stabilize-dom.html`)
      })

      it('serializes input elements', async () => {
        await page.type('#testInputText', 'test input value')
        await page.type('#testTextarea', 'test textarea value')
        await page.click('#testCheckbox')
        await page.select('#testSelect', 'maybe')
        await page.click('#testRadioButton')

        const domSnapshot = await snapshot(page, 'Serialize input elements')
        const $ = cheerio.load(domSnapshot)

        expect($('#testInputText').attr('value')).to.equal('test input value')
        expect($('#testTextarea').text()).to.equal('test textarea value')
        expect($('#testCheckbox').attr('checked')).to.equal('checked')
        expect($('#testSelect').children().eq(2).attr('selected')).to.equal('selected')
        expect($('#testRadioButton').attr('checked')).to.equal('checked')
      })
    })

    describe('stablizes CSSOM', () => {
      before(async () => {
        await page.goto(`http://localhost:${PORT}/stabilize-cssom.html`)
      })

      it('serializes the CSSOM', async () => {
        const domSnapshot = await snapshot(page, 'Serialize CSSOM')

        expect(domSnapshot).to.contain('data-percy-cssom-serialized')
        expect(domSnapshot).to.contain('.box { height: 500px; width: 500px; background-color: green; }')

        // we want to ensure mutiple snapshots are successful
        const secondDomSnapshot = await snapshot(page, 'Serialize CSSOM twice')
        expect(secondDomSnapshot).to.contain('data-percy-cssom-serialized')
        expect(secondDomSnapshot).to.contain('.box { height: 500px; width: 500px; background-color: green; }')

      })
    })

    describe('canvas', () => {
      it('captures canvas elements', async () => {
        await page.goto(`http://localhost:${PORT}/serialize-canvas.html`)
        await page.waitForSelector('#webgl canvas')
        // I cannot think of a nicer way to let the canvas animations/drawing settle
        // so sadly, use a timeout
        await page.waitForTimeout(1000)
        const domSnapshot = await snapshot(page, 'Canvas elements')
        const $ = cheerio.load(domSnapshot)

        expect($('[data-percy-canvas-serialized]').length).to.equal(2)
      })

      it("doesn't serialize with JS enabled", async () => {
        await page.goto(`http://localhost:${PORT}/serialize-canvas.html`)
        await page.waitForSelector('#webgl canvas')
        await page.waitForTimeout(1000)
        const domSnapshot = await snapshot(page, 'Canvas elements -- with JS', { enableJavaScript: true })
        const $ = cheerio.load(domSnapshot)

        expect($('[data-percy-canvas-serialized]').length).to.equal(0)
      })
    })
  })
})
