import * as std from 'stdout-stderr'

export async function captureStdOut(callback: any): Promise<string> {
  std.stdout.start()

  try {
    await callback()
  } catch (err) {
    if (!err.oclif || err.oclif.exit !== 0) { throw err }
  } finally {
    std.stdout.stop()
  }

  return std.stdout.output
}

export async function captureStdErr(callback: any): Promise<string> {
  std.stderr.start()

  try {
    await callback()
  } catch (err) {
    if (!err.oclif || err.oclif.exit !== 0) { throw err }
  } finally {
    std.stderr.stop()
  }

  return std.stderr.output
}
