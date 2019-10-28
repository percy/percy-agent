"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const configuration_1 = require("../configuration/configuration");
const health_checker_1 = require("../utils/health-checker");
class HealthCheck extends command_1.Command {
    async run() {
        const { flags } = this.parse(HealthCheck);
        const port = flags.port;
        await health_checker_1.default(port, {
            shouldRetry: () => false,
        });
    }
}
HealthCheck.description = 'Determines if the Percy Agent process is currently running';
HealthCheck.hidden = true;
HealthCheck.flags = {
    port: command_1.flags.integer({
        char: 'p',
        default: configuration_1.DEFAULT_CONFIGURATION.agent.port,
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION.agent.port}]`,
            'Port',
        ].join(' '),
    }),
};
HealthCheck.examples = [
    '$ percy healthcheck',
    '$ percy healthcheck --port 6884',
];
exports.default = HealthCheck;
