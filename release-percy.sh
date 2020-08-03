#!/bin/bash

# Set the npm registry auth token
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

# Grab the local version and check to see if that version exists on npm
agentAlreadyReleased=$(npm view @percy/agent versions | grep $(node -p "require('./package.json').version"))

# If the package with that version has not yet been released, go ahead and release it.
if [ !$agentAlreadyReleased ]; then
  npm publish
else
  echo "Skipping @percy/agent publishing because the desired version has already been published."
fi

# Ship the `percy` shadow package
# https://www.npmjs.com/package/percy

# First we jam `percy` into the package name
sed -i 's/@percy\/agent/percy/g' package.json

# Next we grab the local version and check to see if that version exists on npm
percyAlreadyReleased=$(npm view percy versions | grep $(node -p "require('./package.json').version"))

# If the package with that version has not yet been released, go ahead and release it.
if [ !$percyAlreadyReleased ]; then
  npm publish
else
  echo "Skipping percy publishing because the desired version has already been published."
fi
