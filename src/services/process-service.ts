import * as childProcess from 'child_process'
import * as fs from 'fs'

export default class ProcessService {
  static PID_PATH = './.percy-agent.pid'
  static LOG_PATH = './percy-agent-process.log'

  async runDetached(args: string[]): Promise<number | null> {
    if (await this.isRunning()) { return null }

    const logFile = fs.openSync(ProcessService.LOG_PATH, 'a+')

    const spawnedProcess = childProcess.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', logFile, logFile] // logs and errors go into the same file
    })

    await this.writePidFile(spawnedProcess.pid)

    spawnedProcess.unref()

    return spawnedProcess.pid
  }

  async isRunning(): Promise<boolean> {
    return fs.existsSync(ProcessService.PID_PATH)
  }

  async getPid(): Promise<number> {
    let pidFileContents: Buffer = await fs.readFileSync(ProcessService.PID_PATH)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  async kill() {
    const running = await this.isRunning()

    if (running) {
      const pid = await this.getPid()

      await fs.unlinkSync(ProcessService.PID_PATH)
      process.kill(pid, 'SIGHUP')
    }
  }

  private async writePidFile(pid: number) {
    await fs.writeFileSync(ProcessService.PID_PATH, pid)
  }
}
