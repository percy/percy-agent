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
$ percy-agent COMMAND
running command...
$ percy-agent (-v|--version|version)
@percy/agent/0.0.4 darwin-x64 node-v8.5.0
$ percy-agent --help [COMMAND]
USAGE
  $ percy-agent COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`percy-agent help [COMMAND]`](#percy-agent-help-command)
* [`percy-agent percy-command`](#percy-agent-percy-command)
* [`percy-agent start`](#percy-agent-start)
* [`percy-agent stop`](#percy-agent-stop)

## `percy-agent help [COMMAND]`

display help for percy-agent

```
USAGE
  $ percy-agent help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.0.5/src/commands/help.ts)_

## `percy-agent percy-command`

```
USAGE
  $ percy-agent percy-command
```

_See code: [dist/commands/percy-command.ts](https://github.com/percy/percy-agent/blob/v0.0.4/dist/commands/percy-command.ts)_

## `percy-agent start`

Starts the percy-agent process.

```
USAGE
  $ percy-agent start

OPTIONS
  -d, --detached   start as a detached process
  -p, --port=port  [default: 5338] port

EXAMPLE
  $ percy-agent start
  info: percy-agent has started on port 5338. Logs available at log/percy-agent.log
```

_See code: [dist/commands/start.ts](https://github.com/percy/percy-agent/blob/v0.0.4/dist/commands/start.ts)_

## `percy-agent stop`

Stops the percy-agent process.

```
USAGE
  $ percy-agent stop

OPTIONS
  -p, --port=port  [default: 5338] port

EXAMPLE
  $ percy-agent stop
  info: percy-agent has stopped.
```

_See code: [dist/commands/stop.ts](https://github.com/percy/percy-agent/blob/v0.0.4/dist/commands/stop.ts)_
<!-- commandsstop -->
