"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const fs = require("fs");
const globby = require("globby");
const image_size_1 = require("image-size");
const os = require("os");
const path = require("path");
const configuration_1 = require("../configuration/configuration");
const logger_1 = require("../utils/logger");
const build_service_1 = require("./build-service");
const percy_client_service_1 = require("./percy-client-service");
const ALLOWED_IMAGE_TYPES = /\.(png|jpg|jpeg)$/i;
class ImageSnapshotService extends percy_client_service_1.default {
    constructor(configuration) {
        super();
        this.buildService = new build_service_1.default();
        this.configuration = configuration || configuration_1.DEFAULT_CONFIGURATION['image-snapshots'];
    }
    get buildId() {
        return this.buildService.buildId;
    }
    makeLocalCopy(imagePath) {
        logger_1.default.debug(`Making local copy of image: ${imagePath}`);
        const buffer = fs.readFileSync(path.resolve(this.configuration.path, imagePath));
        const sha = crypto.createHash('sha256').update(buffer).digest('hex');
        const filename = path.join(os.tmpdir(), sha);
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, buffer);
        }
        else {
            logger_1.default.debug(`Skipping file copy [already_copied]: ${imagePath}`);
        }
        return filename;
    }
    buildResources(imagePath) {
        const { name, ext } = path.parse(imagePath);
        const localCopy = this.makeLocalCopy(imagePath);
        const imageUrl = `/${encodeURIComponent(imagePath)}`;
        const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg';
        const sha = path.basename(localCopy);
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
              html, body, img { width: 100%; margin: 0; padding: 0; font-size: 0; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}"/>
          </body>
        </html>
      `,
        });
        const imgResource = this.percyClient.makeResource({
            resourceUrl: imageUrl,
            localPath: localCopy,
            mimetype,
            sha,
        });
        return [rootResource, imgResource];
    }
    async createSnapshot(name, resources, width, height) {
        return this.percyClient.createSnapshot(this.buildId, resources, {
            name,
            widths: [width],
            minimumHeight: height,
            clientInfo: 'percy-upload',
        }).then(async (response) => {
            await this.percyClient.uploadMissingResources(this.buildId, response, resources);
            return response;
        }).then(async (response) => {
            const snapshotId = response.body.data.id;
            logger_1.profile('-> imageSnapshotService.finalizeSnapshot');
            await this.percyClient.finalizeSnapshot(snapshotId);
            logger_1.profile('-> imageSnapshotService.finalizeSnapshot', { snapshotId });
            return response;
        }).catch(logger_1.logError);
    }
    async snapshotAll() {
        // intentially remove '' values from because that matches every file
        const globs = this.configuration.files.split(',').filter(Boolean);
        const ignore = this.configuration.ignore.split(',').filter(Boolean);
        const paths = await globby(globs, { cwd: this.configuration.path, ignore });
        let error;
        if (!paths.length) {
            logger_1.default.error(`no matching files found in '${this.configuration.path}''`);
            logger_1.default.info('exiting');
            return process.exit(1);
        }
        await this.buildService.create();
        logger_1.default.debug('uploading snapshots of static images');
        try {
            // wait for snapshots in parallel
            await Promise.all(paths.reduce((promises, pathname) => {
                logger_1.default.debug(`handling snapshot: '${pathname}'`);
                // only snapshot supported images
                if (!pathname.match(ALLOWED_IMAGE_TYPES)) {
                    logger_1.default.info(`skipping unsupported image type: '${pathname}'`);
                    return promises;
                }
                // @ts-ignore - if dimensions are undefined, the library throws an error
                const { width, height } = image_size_1.imageSize(path.resolve(this.configuration.path, pathname));
                const resources = this.buildResources(pathname);
                const snapshotPromise = this.createSnapshot(pathname, resources, width, height);
                logger_1.default.info(`snapshot uploaded: '${pathname}'`);
                promises.push(snapshotPromise);
                return promises;
            }, []));
        }
        catch (err) {
            error = err;
            logger_1.logError(err);
        }
        // finalize build
        await this.buildService.finalize();
        // if an error occurred, exit with non-zero
        if (error) {
            process.exit(1);
        }
    }
}
exports.default = ImageSnapshotService;
