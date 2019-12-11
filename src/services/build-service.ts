import * as colors from 'colors'
import logger, {logError} from '../utils/logger'
import PercyClientService from './percy-client-service'

export default class BuildService extends PercyClientService {
  buildUrl: string | null = null
  buildNumber: number | null = null
  buildId: number | null = null

  async create(): Promise<number | null> {
    try {
      const build = await this.percyClient
        .createBuild()

      const buildData = build.body.data

      this.buildId = parseInt(buildData.id) as number
      this.buildNumber = parseInt(buildData.attributes['build-number'])
      this.buildUrl = buildData.attributes['web-url']

      this.logEvent('created')

      return this.buildId
    } catch (e) {
      logError(e)
    }

    return null
  }

  async finalize() {
    if (!this.buildId) { return }

    try {
      await this.percyClient.finalizeBuild(this.buildId)
      this.logEvent('finalized')
    } catch (err) {
      logger.error('error finalizing build')
      logError(err)
    }
  }

  async finalizeAll(): Promise<any> {
    process.env.PERCY_PARALLEL_TOTAL = '-1'

    const build = await this.percyClient.createBuild().catch(logError)
    const buildId = parseInt(build.body.data.id) as number

    const result = await this.percyClient.finalizeBuild(buildId, {allShards: true}).catch(logError)

    if (result) { return build }
  }

  private logEvent(event: string) {
    logger.info(`${event} build #${this.buildNumber}: ` + colors.blue(`${this.buildUrl}`))
  }
}
