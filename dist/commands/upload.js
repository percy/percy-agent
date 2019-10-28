"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const configuration_1 = require("../configuration/configuration");
const image_snapshot_service_1 = require("../services/image-snapshot-service");
const configuration_2 = require("../utils/configuration");
class Upload extends command_1.Command {
    constructor() {
        super(...arguments);
        this.percyToken = process.env.PERCY_TOKEN || '';
    }
    percyTokenPresent() {
        return this.percyToken.trim() !== '';
    }
    async run() {
        // exit gracefully if percy token was not provided
        if (!this.percyTokenPresent()) {
            this.warn('PERCY_TOKEN was not provided.');
            this.exit(0);
        }
        const { args, flags } = this.parse(Upload);
        const configuration = configuration_2.default(flags, args);
        // upload snapshot images
        const imageSnapshotService = new image_snapshot_service_1.default(configuration['image-snapshots']);
        await imageSnapshotService.snapshotAll();
    }
}
Upload.description = 'Upload a directory containing static snapshot images.';
Upload.hidden = false;
Upload.args = [{
        name: 'uploadDirectory',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['static-snapshots'].path}]`,
            'A path to the directory containing static snapshot images',
        ].join(' '),
    }];
Upload.examples = [
    '$ percy upload _images/',
    '$ percy upload _images/ --files **/*.png',
];
Upload.flags = {
    files: command_1.flags.string({
        char: 'f',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['image-snapshots'].files}]`,
            'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
        ].join(' '),
    }),
    ignore: command_1.flags.string({
        char: 'i',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['image-snapshots'].ignore}]`,
            'Glob or comma-seperated string of globs for matching the files and directories to ignore.',
        ].join(' '),
    }),
    config: command_1.flags.string({
        char: 'c',
        description: 'Path to percy config file',
    }),
};
exports.default = Upload;
