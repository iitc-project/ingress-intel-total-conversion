#!/bin/sh

set -e

cd /tmp
rm -rf ingress-intel-total-conversion
git clone --depth=1  git://github.com/breunigs/ingress-intel-total-conversion.git
cd ingress-intel-total-conversion
./build.py

date=$(date +"%Y-%m-%d")
commit=$(git rev-parse HEAD | head -c 10)

# https://github.com/andreafabrizi/Dropbox-Uploader
dropbox-up upload iitc-debug.user.js iitc-nightly/iitc-nightly-$date-$commit.user.js
