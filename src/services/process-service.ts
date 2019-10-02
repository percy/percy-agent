import * as childProcess from 'child_process'
import * as fs from 'fs'

export default class ProcessService {
  static PID_PATH = './.percy.pid'
  static LOG_PATH = './percy-process.log'

  runDetached(args: string[]): number | undefined {
    if (this.isRunning()) { return }

    const logFile = fs.openSync(ProcessService.LOG_PATH, 'a+')

    const spawnedProcess = childProcess.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', logFile, logFile], // logs and errors go into the same file
    })

    this.writePidFile(spawnedProcess.pid)
    spawnedProcess.unref()

    return spawnedProcess.pid
  }

  isRunning(): boolean {
    return fs.existsSync(ProcessService.PID_PATH)
  }

  getPid(): number {
    const pidFileContents: Buffer = fs.readFileSync(ProcessService.PID_PATH)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  kill() {
    if (this.isRunning()) {
      const pid = this.getPid()
      this.cleanup()

      process.kill(pid, 'SIGHUP')
    }
  }

  cleanup() {
    try {
      fs.unlinkSync(ProcessService.PID_PATH)
    } catch (e) {
      // it's fine when the file doesn't exist, raise errors otherwise
      if (e.code !== 'ENOENT') { throw e }
    }
  }

  private writePidFile(pid: number) {
    fs.writeFileSync(ProcessService.PID_PATH, pid)
  }
}
