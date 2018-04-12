interface Request {
    name: string;
}
declare class RequestManifest {
    capture(): string[];
}
interface SnapshotOptions {
    enableJavascript?: boolean;
    widths?: number[];
    minimumHeight?: number;
}
declare class Percy {
    clientUserAgent: string | null;
    beforeSnapshot: any;
    readonly defaultDoctype: string;
    constructor(clientUserAgent?: string, beforeSnapshot?: any);
    snapshot(name: string, options: SnapshotOptions): void;
    private domSnapshot();
    private getDoctype();
    private doctypeToString(doctype);
    private stabalizePage();
}
declare class PercyAgent {
    post(url: string, data: any): void;
}
