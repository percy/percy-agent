#!/bin/bash

docker build . -t percyio/percy-agent:latest
docker push percyio/percy-agent:latest
