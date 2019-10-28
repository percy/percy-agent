import { Command, flags } from '@oclif/command';
export default class Upload extends Command {
    static description: string;
    static hidden: boolean;
    static args: {
        name: string;
        description: string;
    }[];
    static examples: string[];
    static flags: {
        files: flags.IOptionFlag<string | undefined>;
        ignore: flags.IOptionFlag<string | undefined>;
        config: flags.IOptionFlag<string | undefined>;
    };
    percyToken: string;
    percyTokenPresent(): boolean;
    run(): Promise<void>;
}
