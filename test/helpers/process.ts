import * as fs from 'fs'
import ProcessService from '../../src/services/process-service'

export function createPidFile(pid = 123) {
  fs.writeFileSync(ProcessService.pidPath, pid)
}

export function deletePidFile(): void {
  if (pidFileExists()) { fs.unlinkSync(ProcessService.pidPath) }
}

export function pidFileExists(): boolean {
  return fs.existsSync(ProcessService.pidPath)
}
