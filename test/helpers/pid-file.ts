import * as fs from 'fs'
import ProcessService from '../../src/services/process-service'

export async function createPidFile() {
  fs.writeFileSync(ProcessService.pidPath, 123)
}

export async function deletePidFile() {
  fs.unlinkSync(ProcessService.pidPath)
}
