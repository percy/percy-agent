## [0.5.2](https://github.com/percy/percy-agent/compare/v0.5.1...v0.5.2) (2019-06-03)


### Bug Fixes

* [Security] Upgrade axios ([#217](https://github.com/percy/percy-agent/issues/217)) ([ee635c7](https://github.com/percy/percy-agent/commit/ee635c7))

## [0.5.1](https://github.com/percy/percy-agent/compare/v0.5.0...v0.5.1) (2019-05-31)


### Bug Fixes

* Serialize in-memory attributes into deep DOM clone ([#208](https://github.com/percy/percy-agent/issues/208)) ([56d76bd](https://github.com/percy/percy-agent/commit/56d76bd))

# [0.5.0](https://github.com/percy/percy-agent/compare/v0.4.9...v0.5.0) (2019-05-30)


### Features

* Support parallel snapshots calls ([#168](https://github.com/percy/percy-agent/issues/168)) ([744a399](https://github.com/percy/percy-agent/commit/744a399))

## [0.4.9](https://github.com/percy/percy-agent/compare/v0.4.8...v0.4.9) (2019-05-21)


### Bug Fixes

* Improved readme and help text ([#200](https://github.com/percy/percy-agent/issues/200)) ([34c066c](https://github.com/percy/percy-agent/commit/34c066c))

## [0.4.8](https://github.com/percy/percy-agent/compare/v0.4.7...v0.4.8) (2019-05-14)


### Bug Fixes

* Disable HTTPS errors for asset discovery ([#199](https://github.com/percy/percy-agent/issues/199)) ([e19c91e](https://github.com/percy/percy-agent/commit/e19c91e))

## [0.4.7](https://github.com/percy/percy-agent/compare/v0.4.6...v0.4.7) (2019-05-14)


### Bug Fixes

* Remove unused AppVeyor and Codecov badges. Closes [#197](https://github.com/percy/percy-agent/issues/197) ([#198](https://github.com/percy/percy-agent/issues/198)) ([a6a1e99](https://github.com/percy/percy-agent/commit/a6a1e99))

## [0.4.6](https://github.com/percy/percy-agent/compare/v0.4.5...v0.4.6) (2019-05-09)


### Bug Fixes

* Lock to `@oclif/command` 1.5.10 to avoid `MaxListenersExceededWarning`. Closes [#187](https://github.com/percy/percy-agent/issues/187) ([#189](https://github.com/percy/percy-agent/issues/189)) ([50a2e76](https://github.com/percy/percy-agent/commit/50a2e76))

## [0.4.5](https://github.com/percy/percy-agent/compare/v0.4.4...v0.4.5) (2019-05-08)


### Bug Fixes

* Make `snapshot` command visible ([#186](https://github.com/percy/percy-agent/issues/186)) ([c3e08ab](https://github.com/percy/percy-agent/commit/c3e08ab))

## [0.4.4](https://github.com/percy/percy-agent/compare/v0.4.3...v0.4.4) (2019-05-03)


### Bug Fixes

* Expose `PercyAgent` as a global always ([#178](https://github.com/percy/percy-agent/issues/178)) ([698067b](https://github.com/percy/percy-agent/commit/698067b))

## [0.4.3](https://github.com/percy/percy-agent/compare/v0.4.2...v0.4.3) (2019-05-02)


### Bug Fixes

* Revert change to module bundling ([#177](https://github.com/percy/percy-agent/issues/177)) ([0f575f2](https://github.com/percy/percy-agent/commit/0f575f2))

## [0.4.2](https://github.com/percy/percy-agent/compare/v0.4.1...v0.4.2) (2019-05-02)


### Bug Fixes

* Build `PercyAgent` code that's inject in browser as iife ([#176](https://github.com/percy/percy-agent/issues/176)) ([9f1ac26](https://github.com/percy/percy-agent/commit/9f1ac26))

## [0.4.1](https://github.com/percy/percy-agent/compare/v0.4.0...v0.4.1) (2019-04-30)


### Bug Fixes

* Introduce cross-spawn for cross platform commands ([#175](https://github.com/percy/percy-agent/issues/175)) ([f9bc817](https://github.com/percy/percy-agent/commit/f9bc817)), closes [#174](https://github.com/percy/percy-agent/issues/174)

# [0.4.0](https://github.com/percy/percy-agent/compare/v0.3.1...v0.4.0) (2019-04-26)


### Features

* Ability to snapshot a directory of webpages. Usage: `percy snapshot directory/` ([#137](https://github.com/percy/percy-agent/issues/137)) ([20daabb](https://github.com/percy/percy-agent/commit/20daabb))

## [0.3.1](https://github.com/percy/percy-agent/compare/v0.3.0...v0.3.1) (2019-04-18)


### Bug Fixes

* Revert DOM clean up methods ([#160](https://github.com/percy/percy-agent/issues/160)) ([12ab332](https://github.com/percy/percy-agent/commit/12ab332))

# [0.3.0](https://github.com/percy/percy-agent/compare/v0.2.3...v0.3.0) (2019-04-16)


### Features

* Add hidden snapshot command for future implementation ([#120](https://github.com/percy/percy-agent/issues/120)) ([98ae4b8](https://github.com/percy/percy-agent/commit/98ae4b8))

## [0.2.3](https://github.com/percy/percy-agent/compare/v0.2.2...v0.2.3) (2019-04-15)


### Bug Fixes

* Remove @oclif/errors as a devDependency. Closes [#154](https://github.com/percy/percy-agent/issues/154) ([#155](https://github.com/percy/percy-agent/issues/155)) ([2f99c5b](https://github.com/percy/percy-agent/commit/2f99c5b))

## [0.2.2](https://github.com/percy/percy-agent/compare/v0.2.1...v0.2.2) (2019-04-08)


### Bug Fixes

* do not include node-based sdk-utils in default export for package. ([#125](https://github.com/percy/percy-agent/issues/125)) ([4a61b78](https://github.com/percy/percy-agent/commit/4a61b78))

## [0.2.1](https://github.com/percy/percy-agent/compare/v0.2.0...v0.2.1) (2019-04-03)


### Bug Fixes

* Revert & remove `browser` from `package.json` ([#123](https://github.com/percy/percy-agent/issues/123)) ([994f2ad](https://github.com/percy/percy-agent/commit/994f2ad))

# [0.2.0](https://github.com/percy/percy-agent/compare/v0.1.18...v0.2.0) (2019-04-03)


### Features

* Add `healthcheck` command ([#122](https://github.com/percy/percy-agent/issues/122)) ([5560d6a](https://github.com/percy/percy-agent/commit/5560d6a))
