"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const colors = require("colors");
const build_service_1 = require("../services/build-service");
const percy_command_1 = require("./percy-command");
class Finalize extends percy_command_1.default {
    constructor() {
        super(...arguments);
        this.buildService = new build_service_1.default();
    }
    async run() {
        await super.run();
        if (!this.percyWillRun()) {
            this.exit(0);
        }
        this.parse(Finalize);
        const result = await this.buildService.finalizeAll();
        if (result) {
            this.logger.info('Finalized parallel build.');
            const webUrl = result.body.data.attributes['web-url'];
            this.logger.info('Visual diffs are now processing: ' + colors.blue(`${webUrl}`));
        }
    }
}
Finalize.description = 'Finalize a build. Commonly used for parallelized builds, especially when ' +
    'the number of parallelized processes is unknown.';
Finalize.hidden = false;
Finalize.flags = {
    all: command_1.flags.boolean({ char: 'a', required: true }),
};
Finalize.examples = [
    '$ percy finalize --all\n' +
        '[percy] Finalized parallel build.',
];
exports.default = Finalize;
