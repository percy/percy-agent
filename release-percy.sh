#!/bin/bash

# This script is responsible for shipping the `percy` shadow package.
# https://www.npmjs.com/package/percy
#
# Release of the `@percy/agent` package is handled with semantic-release

# First we jam `percy` into the package name
sed -i 's/@percy\/agent/percy/g' package.json

# Next we grab the local version and check to see if that version exists on npm
packageAlreadyReleased=$(npm view percy versions | grep $(node -p "require('./package.json').version"))

# If the package with that version has not yet been released, go ahead and release it.
if [ !$packageAlreadyReleased ]; then
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
  npm publish
else
  echo "Skipping percy package publishing because the desired version has already been published."
fi
