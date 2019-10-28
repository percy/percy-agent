"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const agent_service_1 = require("../services/agent-service");
const process_service_1 = require("../services/process-service");
const logger_1 = require("../utils/logger");
class PercyCommand extends command_1.Command {
    constructor(argv, config) {
        super(argv, config);
        // helps prevent exiting before the agent service has stopped
        this.exiting = false;
        this.agentService = new agent_service_1.AgentService();
        this.processService = new process_service_1.default();
        this.logger = logger_1.default;
        this.percyToken = process.env.PERCY_TOKEN || '';
    }
    async run() {
        if (this.percyEnabled() && !this.percyTokenPresent()) {
            this.warn('Skipping visual tests. PERCY_TOKEN was not provided.');
        }
    }
    percyEnabled() {
        return process.env.PERCY_ENABLE !== '0';
    }
    percyWillRun() {
        return (this.percyEnabled() && this.percyTokenPresent());
    }
    percyTokenPresent() {
        return this.percyToken.trim() !== '';
    }
    logStart() {
        this.logger.info('percy has started.');
    }
    async start(configuration) {
        if (this.percyWillRun()) {
            await this.agentService.start(configuration);
            this.logStart();
            // Receiving any of these events should stop the agent and exit
            process.on('SIGHUP', () => this.stop());
            process.on('SIGINT', () => this.stop());
            process.on('SIGTERM', () => this.stop());
        }
    }
    async stop(exitCode) {
        if (this.exiting) {
            return;
        }
        this.exiting = true;
        if (this.percyWillRun()) {
            await this.agentService.stop();
        }
        process.exit(exitCode || 0);
    }
}
PercyCommand.hidden = true;
exports.default = PercyCommand;
