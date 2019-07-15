import * as cheerio from 'cheerio'
import * as fs from 'fs'
import { Server } from 'http'
import * as httpServer from 'http-server'
import { describe } from 'mocha'
import * as puppeteer from 'puppeteer'
import { agentJsFilename, postSnapshot } from '../../src/utils/sdk-utils'
import chai from '../support/chai'

const expect = chai.expect

// Use this instead of importing PercyAgent - we only want the browserified version
declare var PercyAgent: any

async function snapshot(page: puppeteer.Page, name: string, options: any = {}) {
  await page.addScriptTag({path: agentJsFilename()})
  const domSnapshot = await page.evaluate((name: string, options: any) => {
    const percyAgentClient = new PercyAgent({ handleAgentCommunication: false })
    return percyAgentClient.snapshot(name, options)
  }, name, options)

  await postSnapshot({
    name,
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

    it('snapshots an HTTPS site', async () => {
      await page.goto('https://example.com')
      const domSnapshot = await snapshot(page, 'Example.com HTTPS snapshot')
      expect(domSnapshot).contains('Example Domain')
    })

    it('snapshots an invalid HTTPS site', async () => {
      // maintained by the chrome team
      await page.goto('https://self-signed.badssl.com/')
      const domSnapshot = await snapshot(page, 'Invalid HTTPS')
      expect(domSnapshot).contains('badssl.com')
    })

    it('snapshots a complex website with responsive images', async () => {
      await page.goto('https://polaris.shopify.com/')
      const domSnapshot = await snapshot(page, 'Polaris snapshot', {widths: [300, 1200]})
      expect(domSnapshot).contains('Shopify Polaris')
    })

    it('snapshots a complex website with CSSOM', async () => {
      await page.goto('https://buildkite.com/')
      const domSnapshot = await snapshot(page, 'Buildkite snapshot')
      expect(domSnapshot).contains('Buildkite')
    })

  })

  describe('on local test cases', () => {
    const testCaseDir = `${__dirname}/testcases`
    const PORT = 8000
    let server: Server

    before(() => {
      server = httpServer.createServer({root: testCaseDir}) as Server
      server.listen(PORT)
    })

    after(() => {
      server.close()
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

    describe('responsive  assets', () => {
      it('properly  captures all assets', async () => {
        await page.goto(`http://localhost:${PORT}/responsive-assets.html`)

        await snapshot(page, 'Responsive assets')
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
  })
})
