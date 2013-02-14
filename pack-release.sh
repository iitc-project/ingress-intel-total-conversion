#!/bin/sh

./build.py
cp iitc-debug.user.js          dist/total-conversion-build.user.js
cp style.css                   dist/style.css
cp external/*                  dist/
rm -r dist/images/
cp -r images/                  dist/images/

echo 'Change path of style.css to dist/style.css'
