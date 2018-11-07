echo "Enter the version you'd like to release:"

read version

# we have already run
# circleci orb create percy/agent
# to create the orb
circleci orb validate ./orb.yml && circleci orb publish ./orb.yml percy/agent@dev:$version
