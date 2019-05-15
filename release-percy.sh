#!/bin/bash

sed -i 's/@percy\/agent/percy/g' package.json
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc

# We ask NPM if it has this version already
packageAlreadyReleased=$(npm view percy versions | grep $(node -p "require('./package.json').version"))

if [ !$packageAlreadyReleased ]; then
  npm publish
else
  echo "Skipping percy package publishing because the desired version has already been published."
fi
