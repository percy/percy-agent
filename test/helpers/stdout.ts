const {stdout, stderr} = require('stdout-stderr')

export async function captureStdOut(callback: any): Promise<string> {
  stdout.start()
  await callback()
  stdout.stop()

  return stdout.output
}

export async function captureStdErr(callback: any): Promise<string> {
  stderr.start()
  await callback()
  stderr.stop()

  return stderr.output
}
