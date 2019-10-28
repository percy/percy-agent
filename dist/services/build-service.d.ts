import PercyClientService from './percy-client-service';
export default class BuildService extends PercyClientService {
    buildUrl: string | null;
    buildNumber: number | null;
    buildId: number | null;
    create(): Promise<number | null>;
    finalize(): Promise<void>;
    finalizeAll(): Promise<any>;
    private logEvent;
}
