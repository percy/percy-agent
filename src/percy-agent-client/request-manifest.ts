interface Request {
  name: string
}

export default class RequestManifest {
  capture(): string[] {
    let requests: Request[] = performance.getEntriesByType('resource')
    return requests.map(request => request.name)
  }
}
