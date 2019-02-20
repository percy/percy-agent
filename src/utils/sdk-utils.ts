import Axios from 'axios'
import * as path from 'path'
import Constants from '../services/constants'
import logger from './logger'

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
    const url = `http://localhost:${Constants.PORT}${Constants.SNAPSHOT_PATH}`
    return Axios({
      method: 'post',
      url,
      data: body,
    } as any).then(() => {
      return true
    }).catch((error) => {
      // This code runs in the context of the SDK, so the SDK needs to have LOG_LEVEL=debug
      // enabled for these logs to appear.
      logger.debug(`Error posting snapshot to ${url} with body: ${body}`)
      logger.debug(error)
      return false
    })
  }
