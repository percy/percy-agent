declare module "percy" {
    export default interface SnapshotOptions {
        enable_javascript?: boolean;
        widths?: [number];
    }
    export default class Percy {
        clientUserAgent: string | null;
        constructor(clientUserAgent?: string);
        snapshot(name: string, options: SnapshotOptions): void;
    }
}
