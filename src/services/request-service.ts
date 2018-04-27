import PercyClientService from './percy-client-service'
import Axios from 'axios'
import logger from '../utils/logger'
import unique from '../utils/unique-array'

export default class RequestService extends PercyClientService {
  async processManifest(requestManifest: string[]): Promise<any[]> {
    let resources: any[] = []

    requestManifest = unique(requestManifest)

    logger.info(`processing ${requestManifest.length} requests...`)

    for (let request of requestManifest) {
      if (request.match(/http:\/\/localhost:\d+\/percy/)) {
        logger.debug(`skipping Percy Agent requests: ${request}`)
        break
      }

      logger.debug(`processing request: ${request}`)

      await Axios({
        method: 'get',
        url: request,
        responseType: 'blob'
      }).then(response => {
        let resource = this.percyClient.makeResource({
          resourceUrl: this.parseUrlPath(request),
          content: response.data,
          isRoot: false,
          mimetype: response.headers['Content-Type']
        })

        resources.push(resource)
      }).catch(error => {
        logger.warn(`fetching '${request}' - ${error.message}`)
        logger.debug(error)
      })
    }

    return resources
  }
}
