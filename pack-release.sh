#!/bin/sh

./build.py
cp ttic-debug.user.js          dist/total-conversion-build.user.js
cp style.css                   dist/style.css
cp external/leaflet_google.js  dist/leaflet_google.js
cp external/autolink.js        dist/autolink.js
echo 'Done'
