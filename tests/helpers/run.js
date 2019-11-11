import { exec } from 'child_process'
import expect from 'expect'
import stripAnsi from 'strip-ansi'

/**
 * Runs the given command using `exec` and returns a promise that resolves when
 * child process emits a close event (the stdio streams have closed). The
 * returned promise resolves to a list containing stdout, sterr, and the exit
 * code, and rejects if an `error` is emitted (the process could not be spawned
 * or killed). The returned stdio is an array of chunks stripped of ansi
 * colors. The process is also made available as a `child` property of the
 * returned promise.
 *
 * The PERCY_API environment variable is automatically set to the `proxy`
 * helper's address. Other environment variables can be set using an optional
 * second argument; PATH is inherited and PERCY_TOKEN is set by default.
 *
 * @param {string} cmd - Command to run
 * @param {object} [env={}] - Additional environment variables
 * @returns {[str[], str[], number]} - stdout, stderr, & exit code
 */
export default function run(cmd, env = {}) {
  let deferred = {}
  let promise = new Promise((resolve, reject) => {
    Object.assign(deferred, { resolve, reject })
  })

  // replace "percy " with the local path
  let child = exec(cmd.replace(/^percy /, './bin/run '), {
    env: {
      PATH: process.env.PATH,
      PERCY_API: 'http://localhost:8888',
      PERCY_TOKEN: '<<PERCY_TOKEN>>',
      ...env
    }
  })

  let stdio = [, [], []]
  child.stdio[1].on('data', chunk => stdio[1].push(stripAnsi(chunk.replace(/\n$/, ''))))
  child.stdio[2].on('data', chunk => stdio[2].push(stripAnsi(chunk.replace(/\n$/, ''))))
  child.on('close', code => deferred.resolve([stdio[1], stdio[2], code]))
  child.on('error', err => deferred.reject(err))

  return Object.assign(promise, { child })
}

/**
 * Returns `true` if each item in the expected array matches, in order, each
 * item in the actual array; returns `false` otherwise. A match is determined by
 * checking for a substring or calling `.match` for regular expressions.
 *
 * @param {string[]} actual - Array of strings to test
 * @param {(string|regexp)[]} expected - Expected matches, in order
 * @returns {boolean}
 */
function toHaveEntries(actual, expected) {
  return ([].concat(expected).reduce((last, match) => {
    // already determined failure
    if (last == null) return match

    // find the first index of a match
    let index = actual.findIndex(entry => (
      match instanceof RegExp ? entry.match(match)
        : (entry === match || entry.indexOf(match) > -1)
    ))

    // this match followed the last one or fail
    return index > last ? index : null
  }, -1) ?? -1) > -1
}

// register expect matchers
expect.extend({
  toHaveEntry(actual, expected) {
    return {
      pass: toHaveEntries(actual, expected),
      message: () => [
        `${this.utils.matcherHint('toHaveEntry', { isNot: this.isNot })}\n`,
        `Expected output to ${this.isNot ? 'not ' : ''}contain entry:`,
        `  ${this.utils.printExpected(expected)}`,
        'Received:',
        `  ${this.utils.printReceived(actual)}`
      ].join('\n')
    }
  },

  toHaveEntries(actual, expected) {
    return {
      pass: toHaveEntries(actual, expected),
      message: () => [
        `${this.utils.matcherHint('toHaveEntries', { isNot: this.isNot })}\n`,
        `Expected output to ${this.isNot ? 'not ' : ''}contain entries (in order):`,
        `  ${this.utils.printExpected(expected)}`,
        'Received:',
        `  ${this.utils.printReceived(actual)}`
      ].join('\n')
    }
  }
})
