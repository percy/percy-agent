import * as fs from 'fs'
import * as childProcess from 'child_process'

export default class ProcessService {
  static pidPath = './tmp/percy-agent.pid'
  static logPath = './log/percy-agent.log'
  static errorLogPath = './log/percy-agent-error.log'

  /**
   * Runs the given args as a spawned, detached child process and returns a pid.
   * If the process is already running, `null` is returned.
   */
  async runDetached(args: string[]): Promise<number | null> {
    if (await this.isRunning()) { return null }

    const out = fs.openSync(ProcessService.logPath, 'a+')
    const err = fs.openSync(ProcessService.errorLogPath, 'a+')

    const spawnedProcess = childProcess.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', out, err]
    })

    await this.writePidFile(spawnedProcess.pid)

    spawnedProcess.unref()
    return spawnedProcess.pid
  }

  /**
   * Allows you to find out if the process is running or not.
   */
  async isRunning(): Promise<boolean> {
    return fs.existsSync(ProcessService.pidPath)
  }

  /**
   * Asynchronously fetches the process id from inside the pid file.
   */
  async pid(): Promise<number> {
    let pidFileContents: Buffer = await fs.readFileSync(ProcessService.pidPath)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  /**
   * Kills the process regardless of if it's actually running or not.
   */
  async kill(force = false) {
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

  /**
   * Writes a pid file to disk for later use.
   */
  private async writePidFile(pid: number) {
    await fs.writeFileSync(ProcessService.pidPath, pid)
  }
}
