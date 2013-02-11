#!/bin/sh

./build.py
FORMAT=$(echo "\033[1;33m%w%f\033[0m written")
while inotifywait -qre close_write --exclude "iitc-debug.user.js|.git*" --format "$FORMAT" .
do
  ./build.py
done
