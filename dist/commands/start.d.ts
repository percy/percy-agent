import { flags } from '@oclif/command';
import PercyCommand from './percy-command';
export default class Start extends PercyCommand {
    static description: string;
    static hidden: boolean;
    static examples: string[];
    static flags: {
        'detached': import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        'allowed-hostname': flags.IOptionFlag<string[]>;
        'network-idle-timeout': import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
        'port': import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
        'config': flags.IOptionFlag<string | undefined>;
    };
    run(): Promise<void>;
    stop(exitCode?: any): Promise<void>;
    private runDetached;
}
