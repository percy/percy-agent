import { expect } from 'chai'
import { _setResponseCache, cacheResponse, getResponseCache } from '../../src/utils/response-cache'

// Mock logger
const logger = { debug() { return '' }}
const defaultResponse = {
  url() { return 'http://example.com/foo.txt' },
  status() { return 200 },
  headers() { return 'fake headers' },
  buffer() { return 'hello' },
} as any

describe('Response cache util', () => {
  beforeEach(() => {
    _setResponseCache({})
  })

  it('200 status code response adds to the cache', async () => {
    await cacheResponse(defaultResponse, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql({
      status: 200,
      body: 'hello',
      headers: 'fake headers',
    })
  })

  it('201 status code response adds to the cache', async () => {
    await cacheResponse({ ...defaultResponse, status() { return  201 } }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql({
      status: 201,
      body: 'hello',
      headers: 'fake headers',
    })
  })

  it('calling the cache with the same URL does nothing', async () => {
    await cacheResponse(defaultResponse, logger)
    await cacheResponse(defaultResponse, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql({
      status: 200,
      body: 'hello',
      headers: 'fake headers',
    })
  })

  it('non-200 status code response does not add to the cache', async () => {
    await cacheResponse({ ...defaultResponse, status() { return 300 } }, logger)
    await cacheResponse({ ...defaultResponse, status() { return 500 } }, logger)
    await cacheResponse({ ...defaultResponse, status() { return 401 } }, logger)
    await cacheResponse({ ...defaultResponse, status() { return 404 } }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql(undefined)
  })
})
