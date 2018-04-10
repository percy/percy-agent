interface Request {
    /**
     * URL of the request.
     * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry/name
     */
    name: string;
}
declare class RequestManifest {
    /**
     * Capture a list of URLs for resources requested by this page.
     */
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
