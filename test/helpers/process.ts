import * as fs from 'fs'
import ProcessService from '../../src/services/process-service'

export async function createPidFile(pid: number = 123) {
  fs.writeFileSync(ProcessService.PID_PATH, pid)
}

export async function deletePidFile() {
  if (await pidFileExists()) { fs.unlinkSync(ProcessService.PID_PATH) }
}

export async function pidFileExists(): Promise<boolean> {
  return fs.existsSync(ProcessService.PID_PATH)
}
