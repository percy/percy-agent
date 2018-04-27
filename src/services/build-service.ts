import PercyClientService from './percy-client-service'
import logger from '../utils/logger'

export default class BuildService extends PercyClientService {
  async createBuild(): Promise<number | null> {
    let build = await this.percyClient
      .createBuild(process.env.PERCY_PROJECT)
      .catch((error: any) => {
        logger.error(`${error.name} ${error.message}`)
        logger.debug(error)
      })

    const buildData = build.body.data

    let buildId = parseInt(buildData.id)
    let buildNumber = parseInt(buildData.attributes['build-number'])
    let buildUrl = buildData.attributes['web-url']

    logger.info(`created build #${buildNumber}: ${buildUrl}`)

    return buildId
  }

  async finalizeBuild(buildId: number) {
    await this.percyClient
      .finalizeBuild(buildId)
      .catch((error: any) => {
        logger.error(`${error.name} ${error.message}`)
        logger.debug(error)
      })

    logger.info('finalized build.')
  }
}
