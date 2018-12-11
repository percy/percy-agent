@percy/agent
============

A low-level Node process for interacting with Percy.

[![Version](https://img.shields.io/npm/v/@percy/agent.svg)](https://npmjs.org/package/@percy/agent)
[![CircleCI](https://circleci.com/gh/percy/percy-agent/tree/master.svg?style=shield)](https://circleci.com/gh/percy/percy-agent/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/percy/percy-agent?branch=master&svg=true)](https://ci.appveyor.com/project/percy/percy-agent/branch/master)
[![Codecov](https://codecov.io/gh/percy/percy-agent/branch/master/graph/badge.svg)](https://codecov.io/gh/percy/percy-agent)
[![Downloads/week](https://img.shields.io/npm/dw/@percy/agent.svg)](https://npmjs.org/package/@percy/agent)
[![License](https://img.shields.io/npm/l/@percy/agent.svg)](https://github.com/percy/percy-agent/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @percy/agent
$ percy COMMAND
running command...
$ percy (-v|--version|version)
@percy/agent/0.1.6 darwin-x64 node-v8.7.0
$ percy --help [COMMAND]
USAGE
  $ percy COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`percy exec`](#percy-exec)
* [`percy finalize`](#percy-finalize)
* [`percy help [COMMAND]`](#percy-help-command)

## `percy exec`

Start and stop Percy around a supplied command

```
USAGE
  $ percy exec

OPTIONS
  -p, --port=port                                  [default: 5338] port
  -t, --network-idle-timeout=network-idle-timeout  [default: 50] asset discovery network idle timeout (in milliseconds)

EXAMPLES
  $ percy exec -- echo "percy is running around this echo command"
  $ percy exec -- bash -c "echo foo && echo bar"
```

_See code: [dist/commands/exec.ts](https://github.com/percy/percy-agent/blob/v0.1.6/dist/commands/exec.ts)_

## `percy finalize`

finalize a build

```
USAGE
  $ percy finalize

OPTIONS
  -a, --all  (required)

EXAMPLE
  $ percy finalize --all
  [percy] Finalized parallel build.
```

_See code: [dist/commands/finalize.ts](https://github.com/percy/percy-agent/blob/v0.1.6/dist/commands/finalize.ts)_

## `percy help [COMMAND]`

display help for percy

```
USAGE
  $ percy help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.2/src/commands/help.ts)_
<!-- commandsstop -->
