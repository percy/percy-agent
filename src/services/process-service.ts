import * as childProcess from 'child_process'
import * as fs from 'fs'

export default class ProcessService {
  static pidPath = './.percy-agent.pid'
  static logPath = './percy-agent-process.log'

  runDetached(args: string[]): number | undefined {
    if (this.isRunning()) { return }

    const logFile = fs.openSync(ProcessService.logPath, 'a+')

    const spawnedProcess = childProcess.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', logFile, logFile] // logs and errors go into the same file
    })

    this.writePidFile(spawnedProcess.pid)

    spawnedProcess.unref()

    return spawnedProcess.pid
  }

  isRunning(): boolean {
    return fs.existsSync(ProcessService.pidPath)
  }

  getPid(): number {
    let pidFileContents: Buffer = fs.readFileSync(ProcessService.pidPath)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  kill() {
    if (this.isRunning()) {
      const pid = this.getPid()

      fs.unlinkSync(ProcessService.pidPath)
      process.kill(pid, 'SIGHUP')
    }
  }

  private writePidFile(pid: number) {
    fs.writeFileSync(ProcessService.pidPath, pid)
  }
}
