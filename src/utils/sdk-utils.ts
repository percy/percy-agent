import Axios from 'axios'
import * as path from 'path'
import Constants from '../services/constants'

export function agentJsFilename() {
  try {
    return require.resolve('@percy/agent/dist/public/percy-agent.js')
  } catch {
    return path.resolve(__dirname, '../../dist/public/percy-agent.js')
  }
}

export async function isAgentRunning() {
    return Axios({
      method: 'get',
      url: `http://localhost:${Constants.PORT}${Constants.HEALTHCHECK_PATH}`,
    } as any).then(() => {
      return true
    }).catch((error) => {
      return false
    })
  }

export async function postSnapshot(body: any) {
    return Axios({
      method: 'post',
      url: `http://localhost:${Constants.PORT}${Constants.SNAPSHOT_PATH}`,
      data: body,
    } as any).then(() => {
      return true
    }).catch((error) => {
      return false
    })
  }
