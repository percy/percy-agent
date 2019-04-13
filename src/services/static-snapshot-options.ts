export interface StaticSnapshotOptions {
    staticAssetDirectory: string,
    port: number,
    baseUrl: string,
    snapshotFilesRegex: string,
    ignoreFolders?: string[] | undefined,
  }
