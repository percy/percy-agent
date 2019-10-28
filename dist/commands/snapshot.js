"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const fs_1 = require("fs");
const configuration_1 = require("../configuration/configuration");
const static_snapshot_service_1 = require("../services/static-snapshot-service");
const configuration_2 = require("../utils/configuration");
const logger_1 = require("../utils/logger");
const percy_command_1 = require("./percy-command");
class Snapshot extends percy_command_1.default {
    async run() {
        await super.run();
        const { args, flags } = this.parse(Snapshot);
        const configuration = configuration_2.default(flags, args);
        // exit gracefully if percy will not run
        if (!this.percyWillRun()) {
            this.exit(0);
        }
        const baseUrl = configuration['static-snapshots']['base-url'];
        const snapshotPath = configuration['static-snapshots'].path;
        // check that base url starts with a slash and exit if it is missing
        if (baseUrl[0] !== '/') {
            logger_1.default.warn('The base-url flag must begin with a slash.');
            this.exit(1);
        }
        if (!fs_1.existsSync(snapshotPath)) {
            logger_1.default.warn(`Exiting. The passed directory (${snapshotPath}) is empty.`);
            this.exit(1);
        }
        // start agent service and attach process handlers
        await this.start(configuration);
        const staticSnapshotService = new static_snapshot_service_1.default(configuration['static-snapshots']);
        // start the snapshot service
        await staticSnapshotService.start();
        // take the snapshots
        await staticSnapshotService.snapshotAll();
        // stop the static snapshot and agent services
        await staticSnapshotService.stop();
        await this.stop();
    }
}
Snapshot.description = 'Snapshot a directory containing a pre-built static website.';
Snapshot.hidden = false;
Snapshot.args = [{
        name: 'snapshotDirectory',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['static-snapshots'].path}]`,
            'A path to the directory you would like to snapshot',
        ].join(' '),
    }];
Snapshot.examples = [
    '$ percy snapshot _site/',
    '$ percy snapshot _site/ --base-url "/blog/"',
    '$ percy snapshot _site/ --ignore-files "/blog/drafts/**"',
];
Snapshot.flags = {
    'snapshot-files': command_1.flags.string({
        char: 's',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['static-snapshots']['snapshot-files']}]`,
            'Glob or comma-seperated string of globs for matching the files and directories to snapshot.',
        ].join(' '),
    }),
    'ignore-files': command_1.flags.string({
        char: 'i',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['static-snapshots']['ignore-files']}]`,
            'Glob or comma-seperated string of globs for matching the files and directories to ignore.',
        ].join(' '),
    }),
    'base-url': command_1.flags.string({
        char: 'b',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION['static-snapshots']['base-url']}]`,
            'If your static files will be hosted in a subdirectory, instead',
            'of the webserver\'s root path, set that subdirectory with this flag.',
        ].join(' '),
    }),
    // from exec command. needed to start the agent service.
    'allowed-hostname': command_1.flags.string({
        char: 'h',
        description: 'Allowable hostname(s) to capture assets from',
        multiple: true,
    }),
    'network-idle-timeout': command_1.flags.integer({
        char: 't',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION.agent['asset-discovery']['network-idle-timeout']}]`,
            'Asset discovery network idle timeout (in milliseconds)',
        ].join(' '),
    }),
    'port': command_1.flags.integer({
        char: 'p',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION.agent.port}]`,
            'Port',
        ].join(' '),
    }),
    'config': command_1.flags.string({
        char: 'c',
        description: 'Path to percy config file',
    }),
};
exports.default = Snapshot;
