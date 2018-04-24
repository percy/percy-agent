import PercyClientService from './percy-client-service'
import logger from '../utils/logger'
import {inspect} from 'util'

export default class BuildService extends PercyClientService {
  async createBuild(): Promise<number> {
    let build = await this.percyClient.createBuild(process.env.PERCY_PROJECT).catch((error: any) => {
      logger.error(`${error.name} ${error.message}`)
      logger.debug(inspect(error))
    })

    let buildId = parseInt(build.body.data.id)
    logger.info(`BuildService#createBuild[Build ${build.body.data.id}]: created`)

    return buildId
  }

  async finalizeBuild(buildId: number) {
    await this.percyClient.finalizeBuild(buildId)

    logger.info(`BuildService#createBuild[Build ${buildId}]: finalized`)
  }
}
