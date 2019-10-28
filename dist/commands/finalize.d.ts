import BuildService from '../services/build-service';
import PercyCommand from './percy-command';
export default class Finalize extends PercyCommand {
    static description: string;
    static hidden: boolean;
    static flags: {
        all: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    static examples: string[];
    buildService: BuildService;
    run(): Promise<void>;
}
