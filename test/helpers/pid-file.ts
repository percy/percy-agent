import * as fs from 'fs'
import ProcessService from '../../src/services/process-service'

export async function createPidFile(pid: number) {
  fs.writeFileSync(ProcessService.pidPath, pid)
}

export async function deletePidFile() {
  fs.unlinkSync(ProcessService.pidPath)
}
