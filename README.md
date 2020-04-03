@percy/agent
============

A low-level Node process for interacting with Percy.

[![Version](https://img.shields.io/npm/v/@percy/agent.svg)](https://npmjs.org/package/@percy/agent)
[![CircleCI](https://circleci.com/gh/percy/percy-agent/tree/master.svg?style=shield)](https://circleci.com/gh/percy/percy-agent/tree/master)
[![This project is using Percy.io for visual regression testing.](https://percy.io/static/images/percy-badge.svg)](https://percy.io/percy/percy-agent)
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
@percy/agent/0.26.1 linux-x64 node-v12.16.1
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
* [`percy snapshot [SNAPSHOTDIRECTORY]`](#percy-snapshot-snapshotdirectory)
* [`percy upload [UPLOADDIRECTORY]`](#percy-upload-uploaddirectory)

## `percy exec`

Start and stop Percy around a supplied command.

```
USAGE
  $ percy exec

OPTIONS
  -c, --config=config                              Path to percy config file
  -h, --allowed-hostname=allowed-hostname          Allowable hostname(s) to capture assets from
  -p, --port=port                                  [default: 5338] Port
  -t, --network-idle-timeout=network-idle-timeout  [default: 125] Asset discovery network idle timeout (in milliseconds)

  --cache-responses                                [default: true] Caches successful network responses in asset
                                                   discovery

EXAMPLES
  $ percy exec -- echo "percy is running around this echo command"
  $ percy exec -- bash -c "echo foo && echo bar"
```

_See code: [dist/commands/exec.ts](https://github.com/percy/percy-agent/blob/v0.26.1/dist/commands/exec.ts)_

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

_See code: [dist/commands/finalize.ts](https://github.com/percy/percy-agent/blob/v0.26.1/dist/commands/finalize.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `percy snapshot [SNAPSHOTDIRECTORY]`

Snapshot a directory containing a pre-built static website.

```
USAGE
  $ percy snapshot [SNAPSHOTDIRECTORY]

ARGUMENTS
  SNAPSHOTDIRECTORY  [default: .] A path to the directory you would like to snapshot

OPTIONS
  -b, --base-url=base-url                          [default: /] If your static files will be hosted in a subdirectory,
                                                   instead of the webserver's root path, set that subdirectory with this
                                                   flag.

  -c, --config=config                              Path to percy config file

  -d, --dry-run                                    Print the list of paths to snapshot without creating a new build

  -h, --allowed-hostname=allowed-hostname          Allowable hostname(s) to capture assets from

  -i, --ignore-files=ignore-files                  [default: ] Glob or comma-seperated string of globs for matching the
                                                   files and directories to ignore.

  -p, --port=port                                  [default: 5338] Port

  -s, --snapshot-files=snapshot-files              [default: **/*.html,**/*.htm] Glob or comma-seperated string of globs
                                                   for matching the files and directories to snapshot.

  -t, --network-idle-timeout=network-idle-timeout  [default: 125] Asset discovery network idle timeout (in milliseconds)

EXAMPLES
  $ percy snapshot _site/
  $ percy snapshot _site/ --base-url "/blog/"
  $ percy snapshot _site/ --ignore-files "/blog/drafts/**"
```

_See code: [dist/commands/snapshot.ts](https://github.com/percy/percy-agent/blob/v0.26.1/dist/commands/snapshot.ts)_

## `percy upload [UPLOADDIRECTORY]`

Upload a directory containing static snapshot images.

```
USAGE
  $ percy upload [UPLOADDIRECTORY]

ARGUMENTS
  UPLOADDIRECTORY  [default: .] A path to the directory containing static snapshot images

OPTIONS
  -c, --config=config  Path to percy config file
  -d, --dry-run        Print the list of images to upload without uploading them

  -f, --files=files    [default: **/*.png,**/*.jpg,**/*.jpeg] Glob or comma-seperated string of globs for matching the
                       files and directories to snapshot.

  -i, --ignore=ignore  [default: ] Glob or comma-seperated string of globs for matching the files and directories to
                       ignore.

EXAMPLES
  $ percy upload _images/
  $ percy upload _images/ --files **/*.png
```

_See code: [dist/commands/upload.ts](https://github.com/percy/percy-agent/blob/v0.26.1/dist/commands/upload.ts)_
<!-- commandsstop -->
