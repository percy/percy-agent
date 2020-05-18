import { expect } from 'chai'
import { _setResponseCache, cacheResponse, getResponseCache } from '../../../src/utils/response-cache'

// Mock logger
const logger = { debug: () => '' }
const defaultResponse = {
  url: () => 'http://example.com/foo.txt',
  status: () => 200,
  headers: () => ({ 'fake': 'foo=bar' }),
  buffer: () => 'hello',
  text() { return this.buffer() },
  request() {
    return {
      resourceType: () => 'other',
      url: () => this.url(),
    }
  },
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
      headers: { fake: [ 'foo=bar' ] },
    })
  })

  it('201 status code response adds to the cache', async () => {
    await cacheResponse({ ...defaultResponse, status: () => 201 }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql({
      status: 201,
      body: 'hello',
      headers: { fake: [ 'foo=bar' ] },
    })
  })

  it('calling the cache with the same URL does nothing', async () => {
    await cacheResponse(defaultResponse, logger)
    await cacheResponse({ ...defaultResponse, status: () => 201 }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql({
      status: 200,
      body: 'hello',
      headers: { fake: [ 'foo=bar' ] },
    })
  })

  it('non-200 status code response does not add to the cache', async () => {
    await cacheResponse({ ...defaultResponse, status: () => 300 }, logger)
    await cacheResponse({ ...defaultResponse, status: () => 500 }, logger)
    await cacheResponse({ ...defaultResponse, status: () => 401 }, logger)
    await cacheResponse({ ...defaultResponse, status: () => 404 }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql(undefined)
  })

  it('does not cache browser hints', async () => {
    await cacheResponse({ ...defaultResponse, buffer: () => '' }, logger)

    expect(getResponseCache('http://example.com/foo.txt')).to.eql(undefined)
  })

  it('newlines are removed from headers', async () => {
    await cacheResponse({
      ...defaultResponse,
      headers: () => ({ 'fake': 'foo=bar\nthing=baz' })
    }, logger)

    expect(getResponseCache('http://example.com/foo.txt').headers).to.eql({
      fake: [ 'foo=bar', 'thing=baz' ],
    })
  })
})
