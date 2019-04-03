import Axios from 'axios'
import * as retryAxios from 'retry-axios'
import logger from './logger'

async function healthCheck(port: number, retryOptions?: object) {
  const healthcheckUrl = `http://localhost:${port}/percy/healthcheck`

  const retryConfig = {
    retry: 5, // with exponential back off
    retryDelay: 500,
    shouldRetry: () => true,
    ...retryOptions,
  }

  const interceptorId = retryAxios.attach()

  await Axios({
    method: 'get',
    url: healthcheckUrl,
    raxConfig: retryConfig,
  } as any).then(() => {
    logger.info('percy is ready.')
  }).catch((error) => {
    logger.error(`Failed to establish a connection with ${healthcheckUrl}`)
    logger.debug(error)
  })

  retryAxios.detach(interceptorId)
}

export default healthCheck
