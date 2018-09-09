import PercyClientService from './percy-client-service'
import logger, {logError} from '../utils/logger'

export default class BuildService extends PercyClientService {
  buildUrl: string | null = null
  buildNumber: number | null = null
  buildId: number | null = null

  async create(): Promise<number> {
    let build = await this.percyClient
      .createBuild(process.env.PERCY_PROJECT)
      .catch(logError)

    const buildData = build.body.data

    this.buildId = parseInt(buildData.id) as number
    this.buildNumber = parseInt(buildData.attributes['build-number'])
    this.buildUrl = buildData.attributes['web-url']

    this.logEvent('created')

    return this.buildId
  }

  async finalize() {
    await this.percyClient.finalizeBuild(this.buildId).catch(logError)
    this.logEvent('finalized')
  }

  private logEvent(event: string) {
    logger.info(`${event} build #${this.buildNumber}: ${this.buildUrl}`)
  }
}
