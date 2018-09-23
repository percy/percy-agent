import PercyClientService from './percy-client-service'
import logger, {logError} from '../utils/logger'
import * as colors from 'colors'

export default class BuildService extends PercyClientService {
  buildUrl: string | null = null
  buildNumber: number | null = null
  buildId: number | null = null

  async create(): Promise<number> {
    let build = await this.percyClient
      .createBuild()
      .catch(logError)

    const buildData = build.body.data

    this.buildId = parseInt(buildData.id) as number
    this.buildNumber = parseInt(buildData.attributes['build-number'])
    this.buildUrl = buildData.attributes['web-url']

  //   logger.info(colors.magenta('\n\
  //                                    $s,                            \n\
  //                           75###Qs,,|@###s  \'@#,                   \n\
  //                   ;s;;;,,,,,,|5############Q@@###s                \n\
  //                    \'"5##############################s             \n\
  //            .,,,sss@@###################################s  ,,s,    \n\
  //             "5################################"      \'\'""\'\'@###   \n\
  //               \'9@###########################b     ;#@@Q     \'"5O  \n\
  //            ,s@##############################      75###U      |S  \n\
  //        ;@###################################                 ;@O  \n\
  //    ;@#######################################p              \'\'|S   \n\
  //       \'\'@@###########################"""75##S               ;S    \n\
  //       ;@#########################"`        "6            ,s#`     \n\
  //     ;@#########################"                      ;##\'        \n\
  //   ;@#########################W                    ;s#"            \n\
  // ;@##############WW5#########                  ,#W^                \n\
  //      |@######"     @######^                ;#W                    \n\
  //     ;@#####b      ;####"                 @##C                     \n\
  //    ;######b                            ;@##S                      \n\
  //   ;######C                            ;####O                      \n\
  //  |5"\'@@##         ;@####"6#p         ;@####C                      \n\
  //      |@#S       @#####U    \'6p      .@#####p                      \n\
  //       9#S     ;#\'@###U       |S     @\'\'5###                       \n\
  //        7#p  ;S\'   77\'         \'@p  $p   75"                       \n\
  //          """                    \'""'))

    this.logEvent('created')

    return this.buildId
  }

  async finalize() {
    if (!this.buildId) { return }

    await this.percyClient.finalizeBuild(this.buildId).catch(logError)
    this.logEvent('finalized')
  }

  private logEvent(event: string) {
    logger.info(`${event} build #${this.buildNumber}: ` + colors.blue(`${this.buildUrl}`))
  }
}
