import * as fs from 'fs'
import ProcessService from '../../src/services/process-service'

export async function createPidFile(pid: number = 123) {
  fs.writeFileSync(ProcessService.pidPath, pid)
}

export async function deletePidFile() {
  if (await pidFileExists()) { fs.unlinkSync(ProcessService.pidPath) }
}

export async function pidFileExists(): Promise<boolean> {
  return fs.existsSync(ProcessService.pidPath)
}
