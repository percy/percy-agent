import * as crypto from 'crypto'
import * as fs from 'fs'
import * as globby from 'globby'
import { imageSize } from 'image-size'
import * as os from 'os'
import * as path from 'path'

import { DEFAULT_CONFIGURATION } from '../configuration/configuration'
import { ImageSnapshotsConfiguration } from '../configuration/image-snapshots-configuration'
import { parseGlobs } from '../utils/configuration'
import logger, { logError, profile } from '../utils/logger'
import BuildService from './build-service'
import PercyClientService from './percy-client-service'

const ALLOWED_IMAGE_TYPES = /\.(png|jpg|jpeg)$/i

export default class ImageSnapshotService extends PercyClientService {
  private readonly buildService: BuildService
  private readonly configuration: ImageSnapshotsConfiguration

  constructor(configuration?: ImageSnapshotsConfiguration) {
    super()

    this.buildService = new BuildService()
    this.configuration = configuration || DEFAULT_CONFIGURATION['image-snapshots']
  }

  get buildId() {
    return this.buildService.buildId
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

  buildResources(imagePath: string, width: number, height: number): any[] {
    const { name, ext } = path.parse(imagePath)
    const localCopy = this.makeLocalCopy(imagePath)
    const imageUrl = `/${encodeURIComponent(imagePath)}`
    const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg'
    const sha = path.basename(localCopy)

    const rootResource = this.percyClient.makeResource({
      isRoot: true,
      resourceUrl: `/${encodeURIComponent(name)}`,
      mimetype: 'text/html',
      content: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>${imagePath}</title>
            <style>
              *, *::before, *::after { margin: 0; padding: 0; font-size: 0; }
              html, body { width: 100%; }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" width="${width}px" height="${height}px"/>
          </body>
        </html>
      `,
    })

    const imgResource = this.percyClient.makeResource({
      resourceUrl: imageUrl,
      localPath: localCopy,
      mimetype,
      sha,
    })

    return [rootResource, imgResource]
  }

  async createSnapshot(
    name: string,
    resources: any[],
    width: number,
    height: number,
  ): Promise<any> {
    return this.percyClient.createSnapshot(this.buildId, resources, {
      name,
      // clamp between 10px - 2000px
      widths: [Math.max(10, Math.min(width, 2000))],
      minimumHeight: Math.max(10, Math.min(height, 2000)),
      clientInfo: 'percy-upload',
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

  async snapshotAll({ dry = false }: { dry?: boolean } = {}) {
    const globs = parseGlobs(this.configuration.files)
    const ignore = parseGlobs(this.configuration.ignore)
    const paths = (await globby(globs, { cwd: this.configuration.path, ignore })).sort()
    let error

    if (!paths.length) {
      logger.error(`no matching files found in '${this.configuration.path}''`)
      return process.exit(1)
    }

    if (dry) {
      console.log(paths.join('\n'))
      return
    }

    await this.buildService.create()
    logger.debug('uploading snapshots of static images')

    try {
      // wait for snapshots in parallel
      await Promise.all(paths.reduce((promises, pathname) => {
        logger.debug(`handling snapshot: '${pathname}'`)

        // only snapshot supported images
        if (!pathname.match(ALLOWED_IMAGE_TYPES)) {
          logger.info(`skipping unsupported image type: '${pathname}'`)
          return promises
        }

        // @ts-ignore - if dimensions are undefined, the library throws an error
        const { width, height } = imageSize(path.resolve(this.configuration.path, pathname))

        const resources = this.buildResources(pathname, width, height)
        const snapshotPromise = this.createSnapshot(pathname, resources, width, height)
        logger.info(`snapshot uploaded: '${pathname}'`)
        promises.push(snapshotPromise)

        return promises
      }, [] as any[]))
    } catch (err) {
      error = err
      logError(err)
    }

    // finalize build
    await this.buildService.finalize()

    // if an error occurred, exit with non-zero
    if (error) { process.exit(1) }
  }
}
