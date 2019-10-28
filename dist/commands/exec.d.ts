import { flags } from '@oclif/command';
import PercyCommand from './percy-command';
export default class Exec extends PercyCommand {
    static description: string;
    static hidden: boolean;
    static strict: boolean;
    static examples: string[];
    static flags: {
        'allowed-hostname': flags.IOptionFlag<string[]>;
        'network-idle-timeout': import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
        'port': import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
        'config': flags.IOptionFlag<string | undefined>;
    };
    run(): Promise<void>;
}
