import Axios from 'axios'
import * as retryAxios from 'retry-axios'
import { DEFAULT_PORT, HEALTHCHECK_PATH } from '../services/agent-service-constants'
import logger from './logger'

async function healthCheck(port: number = DEFAULT_PORT, retryOptions?: object) {
  const healthcheckUrl = `http://localhost:${port}${HEALTHCHECK_PATH}`

  const retryConfig = {
    retry: 5, // with exponential back off
    retryDelay: 500,
    shouldRetry: () => true,
    ...retryOptions,
  }

  const axiosInstance = Axios.create({ raxConfi: retryConfig } as any)

  const interceptorId = retryAxios.attach(axiosInstance)

  await axiosInstance.get(healthcheckUrl).then(() => {
    logger.info('percy is ready.')
  }).catch((error) => {
    logger.error(`Failed to establish a connection with ${healthcheckUrl}`)
    logger.debug(error)
  })

  retryAxios.detach(interceptorId)
}

export default healthCheck
