#!/bin/sh

./build.rb
FORMAT=$(echo "\033[1;33m%w%f\033[0m written")
while inotifywait -qre close_write --exclude "total-conversion-build.user.js" --format "$FORMAT" .
do
  ./build.rb
done
