#!/bin/sh

set -e

cd `dirname "$0"`
cd ..
./build.py
compressed="$(uglifyjs iitc-debug.user.js)"
echo "${compressed}" > "iitc-debug.user.js"

cd mobile
ant release
