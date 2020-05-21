## [0.26.7](https://github.com/percy/percy-agent/compare/v0.26.6...v0.26.7) (2020-05-21)


### Bug Fixes

* **🐛:** Remove inaccessible JS frames when serializing ([#512](https://github.com/percy/percy-agent/issues/512)) ([86cd887](https://github.com/percy/percy-agent/commit/86cd887))

## [0.26.6](https://github.com/percy/percy-agent/compare/v0.26.5...v0.26.6) (2020-05-18)


### Bug Fixes

* Properly forward headers in asset cache ([#511](https://github.com/percy/percy-agent/issues/511)) ([aa3ac45](https://github.com/percy/percy-agent/commit/aa3ac45))

## [0.26.5](https://github.com/percy/percy-agent/compare/v0.26.4...v0.26.5) (2020-05-18)


### Bug Fixes

* Capture resources even when Puppeteer tab times out ([#510](https://github.com/percy/percy-agent/issues/510)) ([8a39366](https://github.com/percy/percy-agent/commit/8a39366))

## [0.26.4](https://github.com/percy/percy-agent/compare/v0.26.3...v0.26.4) (2020-05-15)


### Bug Fixes

* Abort requests when caught in an error ([#508](https://github.com/percy/percy-agent/issues/508)) ([1c2585d](https://github.com/percy/percy-agent/commit/1c2585d))

## [0.26.3](https://github.com/percy/percy-agent/compare/v0.26.2...v0.26.3) (2020-05-14)


### Bug Fixes

* Ignore any protocols that aren't `http` or `https` ([#507](https://github.com/percy/percy-agent/issues/507)) ([8a121b6](https://github.com/percy/percy-agent/commit/8a121b6))

## [0.26.2](https://github.com/percy/percy-agent/compare/v0.26.1...v0.26.2) (2020-04-03)


### Bug Fixes

* Up default network idle timeout to 125 ([#495](https://github.com/percy/percy-agent/issues/495)) ([1048848](https://github.com/percy/percy-agent/commit/1048848))

## [0.26.1](https://github.com/percy/percy-agent/compare/v0.26.0...v0.26.1) (2020-04-01)


### Bug Fixes

* sort dry-run output ([#494](https://github.com/percy/percy-agent/issues/494)) ([ae36f5a](https://github.com/percy/percy-agent/commit/ae36f5a))

# [0.26.0](https://github.com/percy/percy-agent/compare/v0.25.0...v0.26.0) (2020-03-17)


### Features

* snapshot and upload --dry-run flag ([#486](https://github.com/percy/percy-agent/issues/486)) ([6e259a3](https://github.com/percy/percy-agent/commit/6e259a3))

# [0.25.0](https://github.com/percy/percy-agent/compare/v0.24.3...v0.25.0) (2020-03-13)


### Features

* Capture Canvas elements ([#483](https://github.com/percy/percy-agent/issues/483)) ([7b45c12](https://github.com/percy/percy-agent/commit/7b45c12))

## [0.24.3](https://github.com/percy/percy-agent/compare/v0.24.2...v0.24.3) (2020-03-06)


### Bug Fixes

* Log out snapshot options in debug logs ([#480](https://github.com/percy/percy-agent/issues/480)) ([c524926](https://github.com/percy/percy-agent/commit/c524926))

## [0.24.2](https://github.com/percy/percy-agent/compare/v0.24.1...v0.24.2) (2020-03-05)


### Bug Fixes

* Call `toString` on error ([#479](https://github.com/percy/percy-agent/issues/479)) ([175a3eb](https://github.com/percy/percy-agent/commit/175a3eb)), closes [#478](https://github.com/percy/percy-agent/issues/478)

## [0.24.1](https://github.com/percy/percy-agent/compare/v0.24.0...v0.24.1) (2020-03-04)


### Bug Fixes

* Log DOM transform error so it doesn't end up as [Object object] ([#478](https://github.com/percy/percy-agent/issues/478)) ([1757bf0](https://github.com/percy/percy-agent/commit/1757bf0))

# [0.24.0](https://github.com/percy/percy-agent/compare/v0.23.0...v0.24.0) (2020-03-02)


### Features

* **:sparkles::** add meta information to healthcheck endpoint ([#470](https://github.com/percy/percy-agent/issues/470)) ([c67ed5a](https://github.com/percy/percy-agent/commit/c67ed5a))

# [0.23.0](https://github.com/percy/percy-agent/compare/v0.22.0...v0.23.0) (2020-02-28)


### Features

* Enable asset discovery network caching by default ([#469](https://github.com/percy/percy-agent/issues/469)) ([6b36aab](https://github.com/percy/percy-agent/commit/6b36aab))

# [0.22.0](https://github.com/percy/percy-agent/compare/v0.21.0...v0.22.0) (2020-02-21)


### Features

* iframe serialization ([#468](https://github.com/percy/percy-agent/issues/468)) ([0bf23af](https://github.com/percy/percy-agent/commit/0bf23af))

# [0.21.0](https://github.com/percy/percy-agent/compare/v0.20.13...v0.21.0) (2020-02-03)


### Features

* Use node v10 ([#467](https://github.com/percy/percy-agent/issues/467)) ([920868f](https://github.com/percy/percy-agent/commit/920868f))

## [0.20.13](https://github.com/percy/percy-agent/compare/v0.20.12...v0.20.13) (2020-01-31)


### Bug Fixes

* clamp image dimensions to min and max ([#460](https://github.com/percy/percy-agent/issues/460)) ([ca68b0f](https://github.com/percy/percy-agent/commit/ca68b0f))

## [0.20.12](https://github.com/percy/percy-agent/compare/v0.20.11...v0.20.12) (2020-01-21)


### Bug Fixes

* skip caching empty resources ([#458](https://github.com/percy/percy-agent/issues/458)) ([c2cb769](https://github.com/percy/percy-agent/commit/c2cb769))

## [0.20.11](https://github.com/percy/percy-agent/compare/v0.20.10...v0.20.11) (2020-01-16)


### Bug Fixes

* Skip requests in asset discovery that will never be saved ([#457](https://github.com/percy/percy-agent/issues/457)) ([ce36cf2](https://github.com/percy/percy-agent/commit/ce36cf2))

## [0.20.10](https://github.com/percy/percy-agent/compare/v0.20.9...v0.20.10) (2020-01-16)


### Bug Fixes

* Add timestamps to error logs ([#456](https://github.com/percy/percy-agent/issues/456)) ([b8c0683](https://github.com/percy/percy-agent/commit/b8c0683))

## [0.20.9](https://github.com/percy/percy-agent/compare/v0.20.8...v0.20.9) (2020-01-15)


### Bug Fixes

* Add timestamps to logs ([#455](https://github.com/percy/percy-agent/issues/455)) ([4459521](https://github.com/percy/percy-agent/commit/4459521))

## [0.20.8](https://github.com/percy/percy-agent/compare/v0.20.7...v0.20.8) (2020-01-13)


### Bug Fixes

* Inject Percy CSS before very last closing body tag ([#454](https://github.com/percy/percy-agent/issues/454)) ([6253c26](https://github.com/percy/percy-agent/commit/6253c26))

## [0.20.7](https://github.com/percy/percy-agent/compare/v0.20.6...v0.20.7) (2020-01-13)


### Bug Fixes

* Ensure static image sizes are explicit ([#453](https://github.com/percy/percy-agent/issues/453)) ([085421c](https://github.com/percy/percy-agent/commit/085421c))

## [0.20.6](https://github.com/percy/percy-agent/compare/v0.20.5...v0.20.6) (2019-12-18)


### Bug Fixes

* remove TypeScript types from dependencies ([#439](https://github.com/percy/percy-agent/issues/439)) ([37bf691](https://github.com/percy/percy-agent/commit/37bf691))

## [0.20.5](https://github.com/percy/percy-agent/compare/v0.20.4...v0.20.5) (2019-12-11)


### Bug Fixes

* add context to log output on finalize error ([#436](https://github.com/percy/percy-agent/issues/436)) ([f582027](https://github.com/percy/percy-agent/commit/f582027))

## [0.20.4](https://github.com/percy/percy-agent/compare/v0.20.3...v0.20.4) (2019-12-11)


### Bug Fixes

* don't log success on error ([#435](https://github.com/percy/percy-agent/issues/435)) ([84ac23f](https://github.com/percy/percy-agent/commit/84ac23f))

## [0.20.3](https://github.com/percy/percy-agent/compare/v0.20.2...v0.20.3) (2019-12-09)


### Bug Fixes

* assets loading issues ([#434](https://github.com/percy/percy-agent/issues/434)) ([4028538](https://github.com/percy/percy-agent/commit/4028538))

## [0.20.2](https://github.com/percy/percy-agent/compare/v0.20.1...v0.20.2) (2019-11-22)


### Bug Fixes

* Wait for asset discovery finish when awaiting on snapshot resources in finalize ([#423](https://github.com/percy/percy-agent/issues/423)) ([4a6deea](https://github.com/percy/percy-agent/commit/4a6deea))

## [0.20.1](https://github.com/percy/percy-agent/compare/v0.20.0...v0.20.1) (2019-11-15)


### Bug Fixes

* Add better logging for command not found errors ([#421](https://github.com/percy/percy-agent/issues/421)) ([689a869](https://github.com/percy/percy-agent/commit/689a869))

# [0.20.0](https://github.com/percy/percy-agent/compare/v0.19.7...v0.20.0) (2019-11-08)


### Features

* Introduce asset discovery response caching behind flag ([#419](https://github.com/percy/percy-agent/issues/419)) ([7d7dd52](https://github.com/percy/percy-agent/commit/7d7dd52))

## [0.19.7](https://github.com/percy/percy-agent/compare/v0.19.6...v0.19.7) (2019-11-05)


### Bug Fixes

* ensure CSSOM ownerNode content is present ([#418](https://github.com/percy/percy-agent/issues/418)) ([7d1be16](https://github.com/percy/percy-agent/commit/7d1be16))

## [0.19.6](https://github.com/percy/percy-agent/compare/v0.19.5...v0.19.6) (2019-10-31)


### Bug Fixes

* Pass along second arg to PercyCommand's `stop` ([#409](https://github.com/percy/percy-agent/issues/409)) ([4d0c8a6](https://github.com/percy/percy-agent/commit/4d0c8a6))

## [0.19.5](https://github.com/percy/percy-agent/compare/v0.19.4...v0.19.5) (2019-10-30)


### Bug Fixes

* Create a new console logger for each snapshot ([#407](https://github.com/percy/percy-agent/issues/407)) ([f63b832](https://github.com/percy/percy-agent/commit/f63b832))

## [0.19.4](https://github.com/percy/percy-agent/compare/v0.19.3...v0.19.4) (2019-10-29)


### Bug Fixes

* Trim whitespace from CSS ownerNode innerText ([#406](https://github.com/percy/percy-agent/issues/406)) ([5a4f830](https://github.com/percy/percy-agent/commit/5a4f830))

## [0.19.3](https://github.com/percy/percy-agent/compare/v0.19.2...v0.19.3) (2019-10-28)


### Bug Fixes

* parsing glob strings ([#404](https://github.com/percy/percy-agent/issues/404)) ([d52e552](https://github.com/percy/percy-agent/commit/d52e552))

## [0.19.2](https://github.com/percy/percy-agent/compare/v0.19.1...v0.19.2) (2019-10-28)


### Bug Fixes

* start detached and stop cleanup ([#403](https://github.com/percy/percy-agent/issues/403)) ([2b4662e](https://github.com/percy/percy-agent/commit/2b4662e))

## [0.19.1](https://github.com/percy/percy-agent/compare/v0.19.0...v0.19.1) (2019-10-09)


### Bug Fixes

* Always release puppeteer page in asset discovery ([#396](https://github.com/percy/percy-agent/issues/396)) ([6e4cff1](https://github.com/percy/percy-agent/commit/6e4cff1))

# [0.19.0](https://github.com/percy/percy-agent/compare/v0.18.4...v0.19.0) (2019-10-09)


### Features

* :sparkles: Add client info for upload command ([#395](https://github.com/percy/percy-agent/issues/395)) ([9625c4a](https://github.com/percy/percy-agent/commit/9625c4a))

## [0.18.4](https://github.com/percy/percy-agent/compare/v0.18.3...v0.18.4) (2019-10-07)


### Bug Fixes

* :bug: Default config overrides ([#394](https://github.com/percy/percy-agent/issues/394)) ([ca4ecd1](https://github.com/percy/percy-agent/commit/ca4ecd1))

## [0.18.3](https://github.com/percy/percy-agent/compare/v0.18.2...v0.18.3) (2019-10-04)


### Bug Fixes

* :bug: Config array merging ([#391](https://github.com/percy/percy-agent/issues/391)) ([1574631](https://github.com/percy/percy-agent/commit/1574631))

## [0.18.2](https://github.com/percy/percy-agent/compare/v0.18.1...v0.18.2) (2019-10-03)


### Bug Fixes

* Add rootResourceURL in front of percy specific resources ([#388](https://github.com/percy/percy-agent/issues/388)) ([ebc3594](https://github.com/percy/percy-agent/commit/ebc3594))

## [0.18.1](https://github.com/percy/percy-agent/compare/v0.18.0...v0.18.1) (2019-10-03)


### Bug Fixes

* Restrict try-catch in upload command so build can be finalized ([#387](https://github.com/percy/percy-agent/issues/387)) ([eed8798](https://github.com/percy/percy-agent/commit/eed8798))

# [0.18.0](https://github.com/percy/percy-agent/compare/v0.17.1...v0.18.0) (2019-10-03)


### Features

* :sparkles: Asset discovery headers ([#384](https://github.com/percy/percy-agent/issues/384)) ([488a3b6](https://github.com/percy/percy-agent/commit/488a3b6))

## [0.17.1](https://github.com/percy/percy-agent/compare/v0.17.0...v0.17.1) (2019-10-03)


### Bug Fixes

* :bug: Encode image url for static image uploads ([#385](https://github.com/percy/percy-agent/issues/385)) ([6a52a9c](https://github.com/percy/percy-agent/commit/6a52a9c))

# [0.17.0](https://github.com/percy/percy-agent/compare/v0.16.2...v0.17.0) (2019-10-01)


### Features

* :sparkles: More config file options ([#383](https://github.com/percy/percy-agent/issues/383)) ([b9875a1](https://github.com/percy/percy-agent/commit/b9875a1))

## [0.16.2](https://github.com/percy/percy-agent/compare/v0.16.1...v0.16.2) (2019-10-01)


### Bug Fixes

* Cleanup on stopping agent ([#382](https://github.com/percy/percy-agent/issues/382)) ([cc28320](https://github.com/percy/percy-agent/commit/cc28320)), closes [#340](https://github.com/percy/percy-agent/issues/340)

## [0.16.1](https://github.com/percy/percy-agent/compare/v0.16.0...v0.16.1) (2019-09-25)


### Bug Fixes

* Handle 404 errors when capturing redirected assets ([#354](https://github.com/percy/percy-agent/issues/354)) ([aefcd17](https://github.com/percy/percy-agent/commit/aefcd17))

# [0.16.0](https://github.com/percy/percy-agent/compare/v0.15.2...v0.16.0) (2019-09-25)


### Features

* ✨ Add ability to snapshot a directory of static images ([#353](https://github.com/percy/percy-agent/issues/353)) ([96f1ed5](https://github.com/percy/percy-agent/commit/96f1ed5))

## [0.15.2](https://github.com/percy/percy-agent/compare/v0.15.1...v0.15.2) (2019-09-24)


### Bug Fixes

* Add Percy specific CSS to root resource after asset discovery ([#352](https://github.com/percy/percy-agent/issues/352)) ([5984a65](https://github.com/percy/percy-agent/commit/5984a65))

## [0.15.1](https://github.com/percy/percy-agent/compare/v0.15.0...v0.15.1) (2019-09-20)


### Bug Fixes

* Check for widths array length so empty arrays are never used ([#351](https://github.com/percy/percy-agent/issues/351)) ([e044749](https://github.com/percy/percy-agent/commit/e044749))

# [0.15.0](https://github.com/percy/percy-agent/compare/v0.14.1...v0.15.0) (2019-09-19)


### Features

* Capture redirected assets  ([#349](https://github.com/percy/percy-agent/issues/349)) ([aa918cc](https://github.com/percy/percy-agent/commit/aa918cc))

## [0.14.1](https://github.com/percy/percy-agent/compare/v0.14.0...v0.14.1) (2019-09-19)


### Bug Fixes

* Concat hostname option from CLI & config file ([#348](https://github.com/percy/percy-agent/issues/348)) ([7090bfd](https://github.com/percy/percy-agent/commit/7090bfd))

# [0.14.0](https://github.com/percy/percy-agent/compare/v0.13.0...v0.14.0) (2019-09-18)


### Features

* :sparkles: Allow wildcard hostnames ([#347](https://github.com/percy/percy-agent/issues/347)) ([730161f](https://github.com/percy/percy-agent/commit/730161f))

# [0.13.0](https://github.com/percy/percy-agent/compare/v0.12.2...v0.13.0) (2019-09-17)


### Features

* Introduce an API for Percy Specific CSS ([#346](https://github.com/percy/percy-agent/issues/346)) ([6158f57](https://github.com/percy/percy-agent/commit/6158f57))

## [0.12.2](https://github.com/percy/percy-agent/compare/v0.12.1...v0.12.2) (2019-09-12)


### Bug Fixes

* Exit nicely if the passed directory doesn't exist ([#344](https://github.com/percy/percy-agent/issues/344)) ([f65acaf](https://github.com/percy/percy-agent/commit/f65acaf))

## [0.12.1](https://github.com/percy/percy-agent/compare/v0.12.0...v0.12.1) (2019-09-12)


### Bug Fixes

* Prevent writing to the snapshot log once the resource sha is created ([#345](https://github.com/percy/percy-agent/issues/345)) ([2a46561](https://github.com/percy/percy-agent/commit/2a46561))

# [0.12.0](https://github.com/percy/percy-agent/compare/v0.11.0...v0.12.0) (2019-09-12)


### Features

* Automatically capture Winston logs per-snapshot ([#343](https://github.com/percy/percy-agent/issues/343)) ([780bb1c](https://github.com/percy/percy-agent/commit/780bb1c))

# [0.11.0](https://github.com/percy/percy-agent/compare/v0.10.1...v0.11.0) (2019-09-03)


### Features

* Add configuration option to enable javascript ([#341](https://github.com/percy/percy-agent/issues/341)) ([fb05050](https://github.com/percy/percy-agent/commit/fb05050))

## [0.10.1](https://github.com/percy/percy-agent/compare/v0.10.0...v0.10.1) (2019-08-22)


### Bug Fixes

* Stop and finalize build on exec termination ([#332](https://github.com/percy/percy-agent/issues/332)) ([2fd90b9](https://github.com/percy/percy-agent/commit/2fd90b9))

# [0.10.0](https://github.com/percy/percy-agent/compare/v0.9.2...v0.10.0) (2019-08-07)


### Features

* Support capturing assets from allowed hostnames ([#320](https://github.com/percy/percy-agent/issues/320)) ([c3fb8ac](https://github.com/percy/percy-agent/commit/c3fb8ac))

## [0.9.2](https://github.com/percy/percy-agent/compare/v0.9.1...v0.9.2) (2019-08-06)


### Bug Fixes

* Pin `@oclif/command` to `1.5.16` ([#319](https://github.com/percy/percy-agent/issues/319)) ([2ba2698](https://github.com/percy/percy-agent/commit/2ba2698)), closes [/github.com/oclif/command/compare/v1.5.16...v1.5.17#diff-53649f4ba3d51e10eff913927cc17e0](https://github.com//github.com/oclif/command/compare/v1.5.16...v1.5.17/issues/diff-53649f4ba3d51e10eff913927cc17e0)

## [0.9.1](https://github.com/percy/percy-agent/compare/v0.9.0...v0.9.1) (2019-08-06)


### Bug Fixes

* Log error if there is one from the config service ([#318](https://github.com/percy/percy-agent/issues/318)) ([6432b63](https://github.com/percy/percy-agent/commit/6432b63))
* Use `innerHTML` rather than `innerText` for textareas ([#317](https://github.com/percy/percy-agent/issues/317)) ([b700fbb](https://github.com/percy/percy-agent/commit/b700fbb))

# [0.9.0](https://github.com/percy/percy-agent/compare/v0.8.3...v0.9.0) (2019-07-22)


### Features

* Serialize select elements values ([#295](https://github.com/percy/percy-agent/issues/295)) ([3df435b](https://github.com/percy/percy-agent/commit/3df435b))

## [0.8.3](https://github.com/percy/percy-agent/compare/v0.8.2...v0.8.3) (2019-07-03)


### Bug Fixes

* Reject redirected requests for static snapshots ([#273](https://github.com/percy/percy-agent/issues/273)) ([a75a445](https://github.com/percy/percy-agent/commit/a75a445))

## [0.8.2](https://github.com/percy/percy-agent/compare/v0.8.1...v0.8.2) (2019-07-02)


### Bug Fixes

* `POST` snapshots to the right endpoint ([#271](https://github.com/percy/percy-agent/issues/271)) ([bf8fc6c](https://github.com/percy/percy-agent/commit/bf8fc6c))

## [0.8.1](https://github.com/percy/percy-agent/compare/v0.8.0...v0.8.1) (2019-07-02)


### Bug Fixes

* Static service wait for network idle ([#270](https://github.com/percy/percy-agent/issues/270)) ([7d438d2](https://github.com/percy/percy-agent/commit/7d438d2))

# [0.8.0](https://github.com/percy/percy-agent/compare/v0.7.2...v0.8.0) (2019-07-02)


### Features

* Expanded `.percy.yml` configuration support ([#257](https://github.com/percy/percy-agent/issues/257)) ([9538202](https://github.com/percy/percy-agent/commit/9538202))

## [0.7.2](https://github.com/percy/percy-agent/compare/v0.7.1...v0.7.2) (2019-06-14)


### Bug Fixes

* Strip host from static snapshot names ([#250](https://github.com/percy/percy-agent/issues/250)) ([9026073](https://github.com/percy/percy-agent/commit/9026073))

## [0.7.1](https://github.com/percy/percy-agent/compare/v0.7.0...v0.7.1) (2019-06-13)


### Bug Fixes

* Replace Rollup with Webpack for client JS bundling ([#249](https://github.com/percy/percy-agent/issues/249)) ([450c31e](https://github.com/percy/percy-agent/commit/450c31e))

# [0.7.0](https://github.com/percy/percy-agent/compare/v0.6.0...v0.7.0) (2019-06-06)


### Features

* Improved large resource handling ([#243](https://github.com/percy/percy-agent/issues/243)) ([4681425](https://github.com/percy/percy-agent/commit/4681425))

# [0.6.0](https://github.com/percy/percy-agent/compare/v0.5.3...v0.6.0) (2019-06-06)


### Features

* Support static snapshots in `.percy.yml` configuration file ([#159](https://github.com/percy/percy-agent/issues/159)) ([d9e5efe](https://github.com/percy/percy-agent/commit/d9e5efe))

## [0.5.3](https://github.com/percy/percy-agent/compare/v0.5.2...v0.5.3) (2019-06-06)


### Bug Fixes

* Always apply form elements value property as an attribute ([#227](https://github.com/percy/percy-agent/issues/227)) ([8bcc318](https://github.com/percy/percy-agent/commit/8bcc318))

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
