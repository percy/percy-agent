export default class Constants {
  static readonly PORT: number = 5338
  static readonly NETWORK_IDLE_TIMEOUT: number = 50 // in milliseconds

  // Agent Service paths
  static readonly SNAPSHOT_PATH = '/percy/snapshot'
  static readonly STOP_PATH = '/percy/stop'
  static readonly HEALTHCHECK_PATH = '/percy/healthcheck'
}
