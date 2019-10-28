import PercyCommand from './percy-command';
export default class Stop extends PercyCommand {
    static description: string;
    static hidden: boolean;
    static examples: string[];
    static flags: {
        port: import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
    };
    run(): Promise<void>;
    private postToRunningAgent;
}
