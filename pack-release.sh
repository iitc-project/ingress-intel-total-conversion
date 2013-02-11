#!/bin/sh

./build.py
cp iitc-debug.user.js          dist/total-conversion-build.user.js
cp style.css                   dist/style.css
cp external/leaflet_google.js  dist/leaflet_google.js
cp external/autolink.js        dist/autolink.js

echo 'Change path of style.css to dist/style.css'
