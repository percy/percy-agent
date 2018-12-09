export class PercyAgentClient {
  xhr: XMLHttpRequest
  agentHost: string
  agentConnected = false

  constructor(agentHost: string, xhr?: any) {
    this.agentHost = agentHost
    this.xhr = new xhr() || new XMLHttpRequest()
    this.healthCheck()
  }

  post(path: string, data: any): Promise <any> {
    if (!this.agentConnected) {
      console.warn('percy agent not started.')
      return Promise.resolve()
    }

    return this._makeRequest(
      `${this.agentHost}${path}`,
      'post',
      JSON.stringify(data),
      'application/json',
    )
  }

  healthCheck(): Promise <any> {
    return this._makeRequest(
      `${this.agentHost}/percy/healthcheck`, 'get')
    .then(() => {
      this.agentConnected = true
    })
  }

  _makeRequest(url: string, method?: string, data?: any, contentType?: string): Promise <any> {
    return new Promise<any>(
      (resolve, reject) => {
        this.xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            resolve(this.response)
          } else {
            reject(new Error(this.statusText))
          }
        }
        this.xhr.onerror = function() {
          reject(new Error('XMLHttpRequest Error: ' + this.statusText))
        }
        this.xhr.open(method || 'get', url)
        if (contentType) {
          this.xhr.setRequestHeader('Content-Type', contentType)
        }
        this.xhr.send(data)
    })
  }
}
