#!/bin/bash

docker build --no-cache -t percyio/agent:latest .
docker push percyio/agent:latest
