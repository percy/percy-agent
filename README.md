@percy/agent
============

A low-level Node process for interacting with Percy.

[![Version](https://img.shields.io/npm/v/@percy/agent.svg)](https://npmjs.org/package/@percy/agent)
[![CircleCI](https://circleci.com/gh/percy/percy-agent/tree/master.svg?style=shield)](https://circleci.com/gh/percy/percy-agent/tree/master)
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
@percy/agent/0.9.2 linux-x64 node-v10.16.1
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
* [`percy snapshot SNAPSHOTDIRECTORY`](#percy-snapshot-snapshotdirectory)

## `percy exec`

Start and stop Percy around a supplied command.

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

## `percy finalize`

Finalize a build. Commonly used for parallelized builds, especially when the number of parallelized processes is unknown.

```
USAGE
  $ percy finalize

OPTIONS
  -a, --all  (required)

EXAMPLE
  $ percy finalize --all
  [percy] Finalized parallel build.
```

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `percy snapshot SNAPSHOTDIRECTORY`

Snapshot a directory containing a pre-built static website.

```
USAGE
  $ percy snapshot SNAPSHOTDIRECTORY

ARGUMENTS
  SNAPSHOTDIRECTORY  A path to the directory you would like to snapshot

OPTIONS
  -b, --base-url=base-url                          [default: /] If your static files will be hosted in a subdirectory,
                                                   instead
                                                   of the webserver's root path, set that subdirectory with this flag.

  -i, --ignore-files=ignore-files                  Glob or comma-seperated string of globs for matching the files and
                                                   directories to ignore.

  -p, --port=port                                  [default: 5338] Port

  -s, --snapshot-files=snapshot-files              [default: **/*.html,**/*.htm] Glob or comma-seperated string of globs
                                                   for matching the files and directories to snapshot.

  -t, --network-idle-timeout=network-idle-timeout  [default: 50] Asset discovery network idle timeout (in milliseconds)

EXAMPLES
  $ percy snapshot _site/
  $ percy snapshot _site/ --base-url "/blog/"
  $ percy snapshot _site/ --ignore-files "/blog/drafts/**"
```
<!-- commandsstop -->
