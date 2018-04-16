const {stdout} = require('stdout-stderr')

export async function captureStdOut(callback: any): Promise<string> {
  stdout.start()
  await callback()
  stdout.stop()

  return stdout.output
}
