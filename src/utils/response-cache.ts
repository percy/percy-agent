import { Response } from 'puppeteer'
let responseCache = {} as any

/**
 * Keep an in-memory cache of asset responses.
 *
 * When enabled, asset responses will be kept in memory. When the asset is
 * re-requested, it will be responsed with what the cached response. This makes
 * it so servers aren't being hounded for the same asset over and over again.
 */
export async function cacheResponse(response: Response, logger: any) {
  const request = response.request()
  const responseUrl = response.url()
  const statusCode = response.status()

  if (!!responseCache[responseUrl]) {
    logger.debug(`Asset already in cache ${responseUrl}`)
    return
  }

  if (![200, 201].includes(statusCode)) {
    return
  }

  if (request.resourceType() === 'other' && (await response.text()).length === 0) {
    // Skip empty other resource types (browser resource hints)
    logger.debug(`Skipping caching [is_empty_other]: ${request.url()}`)
    return
  }

  try {
    const buffer = await response.buffer()

    responseCache[responseUrl] = {
      status: response.status(),
      headers: response.headers(),
      body: buffer,
    }

    logger.debug(`Added ${responseUrl} to asset discovery cache`)
  } catch (error) {
    logger.debug(`Could not cache response ${responseUrl}: ${error}`)
  }
}

export function getResponseCache(url: string) {
  return responseCache[url]
}

export function _setResponseCache(newResponseCache: any) {
  responseCache = newResponseCache

  return responseCache
}
