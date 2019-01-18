export default class Constants {
  static readonly PORT: number = 5338

  // Agent Service paths
  static readonly SNAPSHOT_PATH = '/percy/snapshot'
  static readonly STOP_PATH = '/percy/stop'
  static readonly HEALTHCHECK_PATH = '/percy/healthcheck'
}
