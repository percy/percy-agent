import {HEALTHCHECK_PATH} from '../services/agent-service-constants'

export class PercyAgentClient {
  xhr: XMLHttpRequest
  agentHost: string
  agentConnected = false

  constructor(agentHost: string, xhr?: any) {
    this.agentHost = agentHost
    this.xhr = new xhr() || new XMLHttpRequest()
    this.healthCheck()
  }

  post(path: string, data: any) {
    if (!this.agentConnected) {
      console.warn('percy agent not started.')
      return
    }

    this.xhr.open('post', `${this.agentHost}${path}`, false) // synchronous request
    this.xhr.setRequestHeader('Content-Type', 'application/json')
    this.xhr.send(JSON.stringify(data))
  }

  healthCheck() {
    try {
      this.xhr.open('get', `${this.agentHost}${HEALTHCHECK_PATH}`, false)
      this.xhr.onload = () => {
        if (this.xhr.status === 200) {
          this.agentConnected = true
        }
      }
      this.xhr.send()
    } catch {
      this.agentConnected = false
    }
  }
}
