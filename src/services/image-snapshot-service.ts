import * as crypto from 'crypto'
import * as fs from 'fs'
import * as globby from 'globby'
import * as os from 'os'
import * as path from 'path'

import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import { ImageSnapshotsConfiguration } from '../configuration/image-snapshots-configuration'
import logger, { logError, profile } from '../utils/logger'
import PercyClientService from './percy-client-service'

export default class ImageSnapshotService extends PercyClientService {
  private buildId: number | null = null
  private readonly configuration: ImageSnapshotsConfiguration

  constructor(configuration?: ImageSnapshotsConfiguration) {
    super()

    this.configuration = configuration || DEFAULT_CONFIGURATION['image-snapshots']
  }

  makeLocalCopy(imagePath: string) {
    logger.debug(`Making local copy of image: ${imagePath}`)

    const buffer = fs.readFileSync(path.resolve(this.configuration.path, imagePath))
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = path.join(os.tmpdir(), sha)

    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, buffer)
    } else {
      logger.debug(`Skipping file copy [already_copied]: ${imagePath}`)
    }

    return filename
  }

  buildResources(imagePath: string): any[] {
    const { name, ext } = path.parse(imagePath)
    const localCopy = this.makeLocalCopy(imagePath)
    const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg'
    const sha = path.basename(localCopy)

    const rootResource = this.percyClient.makeResource({
      isRoot: true,
      resourceUrl: `/${name}`,
      mimetype: 'text/html',
      content: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>${imagePath}</title>
            <style>
              html, body, img { width: 100%; margin: 0; padding: 0; font-size: 0; }
            </style>
          </head>
          <body>
            <img src="/${imagePath}"/>
          </body>
        </html>
      `,
    })

    const imgResource = this.percyClient.makeResource({
      resourceUrl: `/${imagePath}`,
      localPath: localCopy,
      mimetype,
      sha,
    })

    return [rootResource, imgResource]
  }

  async createSnapshot(
    name: string,
    resources: any[],
  ): Promise<any> {
    return this.percyClient.createSnapshot(this.buildId, resources, {
      name,
    }).then(async (response: any) => {
      await this.percyClient.uploadMissingResources(this.buildId, response, resources)
      return response
    }).then(async (response: any) => {
      const snapshotId = response.body.data.id
      profile('-> imageSnapshotService.finalizeSnapshot')
      await this.percyClient.finalizeSnapshot(snapshotId)
      profile('-> imageSnapshotService.finalizeSnapshot', { snapshotId })
      return response
    }).catch(logError)
  }

  async snapshotAll() {
    try {
      // start build without `BuildService` to avoid duplicate `PercyClient` instances
      const build = await this.percyClient.createBuild()
      this.buildId = parseInt(build.body.data.id) as number

      logger.debug('Uploading snapshots of static images')

      // intentially remove '' values from because that matches every file
      const globs = this.configuration.files.split(',').filter(Boolean)
      const paths = await globby(globs, { cwd: this.configuration.path })

      // wait for snapshots in parallel
      await Promise.all(paths.map((path) => {
        const resources = this.buildResources(path)
        const snapshotPromise = this.createSnapshot(path, resources)
        return snapshotPromise
      }))

      // finalize build
      await this.percyClient.finalizeBuild(this.buildId)
    } catch (error) {
      logError(error)
    }
  }
}
