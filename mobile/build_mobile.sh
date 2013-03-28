#!/bin/sh

set -e

cd `dirname "$0"`
cd ..
./build.py local8000
cd build/local8000
compressed="$(uglifyjs total-conversion-build.user.js)"
echo "${compressed}" > "total-conversion-build.user.js"

cd ../../mobile
ant release
