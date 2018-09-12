export class PercyAgentService {
  xhr: XMLHttpRequest

  constructor(xhr?: any) {
    this.xhr = new xhr() || new XMLHttpRequest()
  }

  post(url: string, data: any) {
    this.xhr.open('post', url, false) // synchronous request
    this.xhr.setRequestHeader('Content-Type', 'application/json')
    this.xhr.send(JSON.stringify(data))
  }
}
