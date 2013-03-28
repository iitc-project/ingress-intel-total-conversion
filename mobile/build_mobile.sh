#!/bin/sh

set -e

cd `dirname "$0"`
cd ..
./build.py local8000
cd build/local8000
cd ../../mobile
ant debug
