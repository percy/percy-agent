export default class PercyAgent {
  post(url: string, data: any) {
    const xhr = new XMLHttpRequest()

    xhr.open('post', url, false) // synchronous request
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(data))
  }
}
