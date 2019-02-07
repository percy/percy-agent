import { describe } from 'mocha'
import * as puppeteer from 'puppeteer'
import AgentService from '../../src/services/agent-service'
import Constants from '../../src/services/constants'
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
  let browser: puppeteer.Browser | null = null
  let page: puppeteer.Page | null = null

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--single-process',
      ],
    })
    page = await browser.newPage()
  })

  after(async () => {
    browser!.close()
  })

  it('takes a snapshot and uploads it to Percy', async () => {
    await page!.goto('http://example.com')
    const domSnapshot = await snapshot(page!, 'Example.com snapshot')
    expect(domSnapshot).contains('Example Domain')
  })
})
