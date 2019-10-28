import { Command } from '@oclif/command';
import * as winston from 'winston';
import { Configuration } from '../configuration/configuration';
import { AgentService } from '../services/agent-service';
import ProcessService from '../services/process-service';
export default class PercyCommand extends Command {
    static hidden: boolean;
    agentService: AgentService;
    processService: ProcessService;
    logger: winston.Logger;
    percyToken: string;
    private exiting;
    constructor(argv: string[], config: any);
    run(): Promise<void>;
    percyEnabled(): boolean;
    percyWillRun(): boolean;
    percyTokenPresent(): boolean;
    logStart(): void;
    start(configuration: Configuration): Promise<void>;
    stop(exitCode?: number | null): Promise<void>;
}
