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



date=$(date +"%Y-%m-%d-%H%M%S")
commit=$(git ls-remote --heads $GIT | head -c 10)
/opt/dropbox-up upload iitc-debug.user.js iitc-nightly/iitc-nightly-$date-$commit.user.js
/opt/dropbox-up upload iitc-debug.user.js iitc-nightly/iitc-nightly-latest.user.js

uglifyjs iitc-debug.user.js > smaller.js
cp smaller.js /home/pi/iitc-appengine/war/iitc-nightly/iitc-nightly-$date-$commit.user.js
cp smaller.js /home/pi/iitc-appengine/war/iitc-nightly/iitc-nightly-latest.user.js
mv screenshots/*  /home/pi/iitc-appengine/war/screenshots
mv images/*  /home/pi/iitc-appengine/war/images
mv dist/images/* /home/pi/iitc-appengine/war/dist/images/
rmdir dist/images
mv dist/* /home/pi/iitc-appengine/war/dist/
rsync -r iitcmbuild:/home/xeen/iitc_mobile_nightly/ /home/pi/iitc-appengine/war/mobile/
cd /home/pi/iitc-appengine/
rm **/*@* # not supported by app engine
./appenginesmall/bin/appcfg.sh update war
