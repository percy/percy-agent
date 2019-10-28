import { Command } from '@oclif/command';
export default class HealthCheck extends Command {
    static description: string;
    static hidden: boolean;
    static flags: {
        port: import("@oclif/parser/lib/flags").IOptionFlag<number>;
    };
    static examples: string[];
    run(): Promise<void>;
}
