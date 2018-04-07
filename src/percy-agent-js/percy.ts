export default interface SnapshotOptions {
  enable_javascript?: boolean,
  widths?: [number],
}

export default class Percy {
  clientUserAgent: string | null

  constructor(clientUserAgent?: string) {
    this.clientUserAgent = clientUserAgent || null
  }

  snapshot(name: string, options: SnapshotOptions) {
    console.log(
      `taking snapshot ${name}. js: ${options.enable_javascript}. widths: ${options.widths}`
    )
  }
}
