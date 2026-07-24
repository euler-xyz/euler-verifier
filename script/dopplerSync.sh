#!/bin/bash

doppler setup -p "euler-verifier" --config "prd"
doppler secrets download --no-file --format env > .env
doppler configure unset config
