#!/bin/zsh

GIT="git://github.com/breunigs/ingress-intel-total-conversion.git"
URL="https://nodeload.github.com/breunigs/ingress-intel-total-conversion/tar.gz/gh-pages"
PTH="ingress-intel-total-conversion-gh-pages"

set -e

cd /tmp
rm -rf $PTH
wget -q -O - $URL | (cd /tmp && tar xfz -)
cd $PTH
./build.py

date=$(date +"%Y-%m-%d")
commit=$(git ls-remote --heads $GIT | head -c 10)
# https://github.com/andreafabrizi/Dropbox-Uploader
/opt/dropbox-up upload iitc-debug.user.js iitc-nightly/iitc-nightly-$date-$commit.user.js
/opt/dropbox-up upload iitc-debug.user.js iitc-nightly/iitc-nightly-latest.user.js

cp iitc-debug.user.js /home/pi/iitc-appengine/war/iitc-nightly/iitc-nightly-$date-$commit.user.js
cp iitc-debug.user.js /home/pi/iitc-appengine/war/iitc-nightly/iitc-nightly-latest.user.js
mv screenshots/*  /home/pi/iitc-appengine/war/screenshots
mv images/*  /home/pi/iitc-appengine/war/images
mv dist/images/* /home/pi/iitc-appengine/war/dist/images/
rmdir dist/images
mv dist/* /home/pi/iitc-appengine/war/dist/
cd /home/pi/iitc-appengine/
rm **/*@* # not supported by app engine
./appenginesmall/bin/appcfg.sh update war
