import * as path from 'path'

export function agentJsFilename() {
  try {
    return require.resolve('@percy/agent/dist/public/percy-agent.js')
  } catch {
    return path.resolve(__dirname, '../../dist/public/percy-agent.js')
  }
}

export default agentJsFilename
