import PercyClientService from './percy-client-service'

export default class BuildService extends PercyClientService {
  async createBuild(): Promise<number> {
    let build = await this.percyClient.createBuild(process.env.PERCY_PROJECT)

    let buildId = parseInt(build.body.data.id)
    console.log(`[info] BuildService#createBuild[Build ${build.body.data.id}]: created`)

    return buildId
  }

  async finalizeBuild(buildId: number) {
    await this.percyClient.finalizeBuild(buildId)

    console.log(`[info] BuildService#createBuild[Build ${buildId}]: finalized`)
  }
}
