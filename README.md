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
@percy/agent/0.0.1 darwin-x64 node-v8.5.0
$ percy-agent --help [COMMAND]
USAGE
  $ percy-agent COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [percy-agent hello [FILE]](#percy-agent-hello-file)
* [percy-agent help [COMMAND]](#percy-agent-help-command)

## percy-agent hello [FILE]

describe the command here

```
USAGE
  $ percy-agent hello [FILE]

OPTIONS
  -f, --force
  -n, --name=name  name to print

EXAMPLE
  $ percy-agent hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/percy/percy-agent/blob/v0.0.1/src/commands/hello.ts)_

## percy-agent help [COMMAND]

display help for percy-agent

```
USAGE
  $ percy-agent help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.2/src/commands/help.ts)_
<!-- commandsstop -->
