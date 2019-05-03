import * as fs from 'fs'
import { Server } from 'http'
import * as httpServer from 'http-server'
import { describe } from 'mocha'
import * as puppeteer from 'puppeteer'
import { agentJsFilename } from '../../src/utils/sdk-utils'
import chai from '../support/chai'

const expect = chai.expect

// Use this instead of importing PercyAgent - we only want the browserified version
declare var PercyAgent: any

async function snapshot(page: puppeteer.Page, name: string, options: any = {}) {
  await page.addScriptTag({path: agentJsFilename()})
  return page.evaluate((name: string, options: any) => {
    const percyAgentClient = new PercyAgent({ clientInfo: 'integration-microSDK' })
    return percyAgentClient.snapshot(name, options)
  }, name, options)
}

describe('Integration test', () => {
  let browser: puppeteer.Browser
  let page: puppeteer.Page

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
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

    it('snapshots all test cases', async () => {
      const testFiles = fs.readdirSync(testCaseDir).filter((fn) => fn.endsWith('.html'))
      for (const fname of testFiles) {
        await page.goto(`http://localhost:${PORT}/${fname}`)
        const domSnapshot = await snapshot(page, `Test case: ${fname}`)
      }
    })

    describe('stabilizes DOM', () => {
      before(async () => {
        await page.goto(`http://localhost:${PORT}/stabilize-dom.html`)
      })

      it('serializes input elements', async () => {
        await page.type('#testInputText', 'test input value')
        await page.type('#testTextarea', 'test textarea value')
        await page.click('#testCheckbox')
        await page.click('#testRadioButton')

        const domSnapshot = await snapshot(page, 'Serialize input elements')
        expect(domSnapshot).to.contain('test input value')
        expect(domSnapshot).to.contain('type="checkbox" checked')
        expect(domSnapshot).to.contain('type="radio" checked')
        expect(domSnapshot).to.contain('test textarea value')
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
