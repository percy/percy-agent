echo "Go to https://circleci.com/orbs/registry/orb/percy/agent to see what the current version is."
echo "Enter the version you'd like to release:"

read version

circleci orb validate ./orb.yml && circleci orb publish ./orb.yml percy/agent@$version
