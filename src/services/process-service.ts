import * as fs from 'fs'
import * as child_process from 'child_process'

export default class ProcessService {
  static pidPath = './tmp/percy-agent.pid'
  static logPath = './log/percy-agent.log'
  static errorLogPath = './log/percy-agent-error.log'

  public async runDetached(args: string[]): Promise<number | null> {
    if (await this.isRunning()) { return null }

    const out = fs.openSync(ProcessService.logPath, 'a+')
    const err = fs.openSync(ProcessService.errorLogPath, 'a+')

    const spawnedProcess = child_process.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', out, err]
    })

    await this.writePidFile(spawnedProcess.pid)

    spawnedProcess.unref()
    return spawnedProcess.pid
  }

  public async isRunning(): Promise<boolean> {
    return fs.existsSync(ProcessService.pidPath)
  }

  public async pid(): Promise<number> {
    let pidFileContents: Buffer = await fs.readFileSync(ProcessService.pidPath)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  public async stop(force = false) {
    if (await !this.isRunning()) {
      return
    } else {
      const pid = await this.pid()

      await fs.unlinkSync(ProcessService.pidPath)
      let signal = 'SIGHUP'
      if (force) { signal = 'SIGKILL' }

      process.kill(pid, signal)
    }
  }

  private async writePidFile(pid: number) {
    await fs.writeFileSync(ProcessService.pidPath, pid)
  }
}
