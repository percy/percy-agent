# Releasing

1. `git checkout -b version-bump`
1. `npm login`
1. `npm version x.x.x` - enter new version
1. `git push origin version-bump`
1. Issue a PR for `version-bump` and merge.
1. `git push --tags`
1. Ensure tests have passed on that tag
1. [Update the release notes](https://github.com/percy/percy-agent/releases) on GitHub
1. `npm publish --access=public` (leave new version blank)
1. [Visit npm](https://www.npmjs.com/package/@percy/agent) and see the new version is live

* Announce the new release,
   making sure to say "thank you" to the contributors
   who helped shape this version!
