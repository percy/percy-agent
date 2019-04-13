export interface StaticSnapshotOptions {
    staticAssetDirectory: string,
    port: number,
    baseUrl: string,
    snapshotCaptureRegex: string,
    ignoreFolders?: string[] | undefined,
  }
