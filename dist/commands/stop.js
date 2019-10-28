"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const axios_1 = require("axios");
const configuration_1 = require("../configuration/configuration");
const agent_service_constants_1 = require("../services/agent-service-constants");
const configuration_2 = require("../utils/configuration");
const logger_1 = require("../utils/logger");
const percy_command_1 = require("./percy-command");
class Stop extends percy_command_1.default {
    async run() {
        await super.run();
        // If Percy is disabled or is missing a token, gracefully exit here
        if (!this.percyWillRun()) {
            this.exit(0);
        }
        const { flags } = this.parse(Stop);
        const configuration = configuration_2.default(flags);
        if (this.processService.isRunning()) {
            await this.postToRunningAgent(agent_service_constants_1.STOP_PATH, configuration.agent.port);
        }
        else {
            this.logger.warn('percy is already stopped.');
        }
    }
    async postToRunningAgent(path, port) {
        await axios_1.default(`http://localhost:${port}${path}`, { method: 'POST' })
            .catch((error) => {
            if (error.message === 'socket hang up') { // We expect a hangup
                this.logger.info('percy stopped.');
            }
            else {
                logger_1.logError(error);
            }
        });
    }
}
Stop.description = 'Stops the percy process.';
Stop.hidden = true;
Stop.examples = [
    '$ percy stop\n' +
        'info: percy has stopped.',
];
Stop.flags = {
    port: command_1.flags.integer({
        char: 'p',
        description: [
            `[default: ${configuration_1.DEFAULT_CONFIGURATION.agent.port}]`,
            'Port',
        ].join(' '),
    }),
};
exports.default = Stop;
