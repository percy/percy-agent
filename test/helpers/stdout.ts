import * as std from 'stdout-stderr'

// removes windows carriages
export function sanitizeOutput(output: string): string {
  return output.replace(/[\r]+/g, '')
}

export async function captureStdOut(callback: any): Promise<string> {
  std.stdout.start()
  await callback()
  std.stdout.stop()

  return sanitizeOutput(std.stdout.output)
}

export async function captureStdErr(callback: any): Promise<string> {
  std.stderr.start()
  await callback()
  std.stderr.stop()

  return sanitizeOutput(std.stderr.output)
}
