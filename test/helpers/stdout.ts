import * as std from 'stdout-stderr'

export async function captureStdOut(callback: any): Promise<string> {
  std.stdout.start()
  await callback()
  std.stdout.stop()

  return std.stdout.output
}

export async function captureStdErr(callback: any): Promise<string> {
  std.stderr.start()
  await callback()
  std.stderr.stop()

  return std.stderr.output
}
