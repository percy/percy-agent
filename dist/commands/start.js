"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const path = require("path");
const configuration_1 = require("../configuration/configuration");
const configuration_2 = require("../utils/configuration");
const health_checker_1 = require("../utils/health-checker");
const percy_command_1 = require("./percy-command");
class Start extends percy_command_1.default {
    async run() {
        await super.run();
        // If Percy is disabled or is missing a token, gracefully exit here
        if (!this.percyWillRun()) {
            this.exit(0);
        }
        const { flags } = this.parse(Start);
        if (flags.detached) {
            this.runDetached(flags);
        }
        else {
            await this.start(configuration_2.default(flags));
        }
        await health_checker_1.default(flags.port);
    }
    async stop(exitCode) {
        this.processService.cleanup();
        await super.stop(exitCode);
    }
    runDetached(flags) {
        const pid = this.processService.runDetached([
            path.resolve(`${__dirname}/../../bin/run`),
            'start',
            '-p', String(flags.port),
            '-t', String(flags['network-idle-timeout']),
        ]);
        if (pid) {
            this.logStart();
        }
        else {
            this.logger.warn('percy is already running');
        }
    }
}
Start.description = 'Starts the percy process.';
Start.hidden = true;
Start.examples = [
    '$ percy start\n' +
        `info: percy has started on port ${configuration_1.DEFAULT_CONFIGURATION.agent.port}.`,
];
Start.flags = {
    'detached': command_1.flags.boolean({
        char: 'd',
        description: 'start as a detached process',
    }),
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
exports.default = Start;
