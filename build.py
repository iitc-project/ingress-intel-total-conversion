#!/usr/bin/env python

import glob
import time
import re
import io
import base64
import sys
import os
import shutil
import json
import shelve
import hashlib

try:
  import urllib2
except ImportError:
  import urllib.request as urllib2

# load settings file
from buildsettings import buildSettings

# load option local settings file
try:
    from localbuildsettings import buildSettings as localBuildSettings
    buildSettings.update(localBuildSettings)
except ImportError:
    pass

# load default build
try:
    from localbuildsettings import defaultBuild
except ImportError:
    defaultBuild = None


buildName = defaultBuild

# build name from command line
if len(sys.argv) == 2:	# argv[0] = program, argv[1] = buildname, len=2
    buildName = sys.argv[1]


if buildName is None or not buildName in buildSettings:
    print ("Usage: build.py buildname")
    print (" available build names: %s" % ', '.join(buildSettings.keys()))
    sys.exit(1)

settings = buildSettings[buildName]

# set up vars used for replacements

utcTime = time.gmtime()
buildDate = time.strftime('%Y-%m-%d-%H%M%S',utcTime)
# userscripts have specific specifications for version numbers - the above date format doesn't match
dateTimeVersion = time.strftime('%Y%m%d.%H%M%S',utcTime)

# extract required values from the settings entry
resourceUrlBase = settings.get('resourceUrlBase')
distUrlBase = settings.get('distUrlBase')
buildMobile = settings.get('buildMobile')


def readfile(fn):
    with io.open(fn, 'Ur', encoding='utf8') as f:
        return f.read()

def loaderString(var):
    fn = var.group(1)
    return readfile(fn).replace('\n', '\\n').replace('\'', '\\\'')

def loaderRaw(var):
    fn = var.group(1)
    return readfile(fn)

def loaderMD(var):
    fn = var.group(1)
    # use different MD.dat's for python 2 vs 3 incase user switches versions, as they are not compatible
    db = shelve.open('build/MDv' + str(sys.version_info.major) + '.dat')
    if 'files' in db:
      files = db['files']
    else:
      files = {}
    file = readfile(fn)
    filemd5 = hashlib.md5(file.encode('utf8')).hexdigest()
    # check if file has already been parsed by the github api
    if fn in files and filemd5 in files[fn]:
      # use the stored copy if nothing has changed to avoid hiting the api more then the 60/hour when not signed in
      db.close()
      return files[fn][filemd5]
    else:
      url = 'https://api.github.com/markdown'
      payload = {'text': file, 'mode': 'markdown'}
      headers = {'Content-Type': 'application/json'}
      req = urllib2.Request(url, json.dumps(payload).encode('utf8'), headers)
      md = urllib2.urlopen(req).read().decode('utf8').replace('\n', '').replace('\'', '\\\'')
      files[fn] = {}
      files[fn][filemd5] = md
      db['files'] = files
      db.close()
      return md

def loaderImage(var):
    fn = var.group(1)
    return 'data:image/png;base64,{0}'.format(base64.encodestring(open(fn, 'rb').read()).decode('utf8').replace('\n', ''))

def loadCode(ignore):
    return '\n\n'.join(map(readfile, glob.glob('code/*')))


def extractUserScriptMeta(var):
    m = re.search ( r"//[ \t]*==UserScript==\n.*?//[ \t]*==/UserScript==\n", var, re.MULTILINE|re.DOTALL )
    return m.group(0)



def doReplacements(script,updateUrl,downloadUrl):

    script = re.sub('@@INJECTCODE@@',loadCode,script)

    script = re.sub('@@INCLUDERAW:([0-9a-zA-Z_./-]+)@@', loaderRaw, script)
    script = re.sub('@@INCLUDESTRING:([0-9a-zA-Z_./-]+)@@', loaderString, script)
    script = re.sub('@@INCLUDEMD:([0-9a-zA-Z_./-]+)@@', loaderMD, script)
    script = re.sub('@@INCLUDEIMAGE:([0-9a-zA-Z_./-]+)@@', loaderImage, script)

    script = script.replace('@@BUILDDATE@@', buildDate)
    script = script.replace('@@DATETIMEVERSION@@', dateTimeVersion)

    if resourceUrlBase:
        script = script.replace('@@RESOURCEURLBASE@@', resourceUrlBase)
    else:
        if '@@RESOURCEURLBASE@@' in script:
            raise Exception("Error: '@@RESOURCEURLBASE@@' found in script, but no replacement defined")

    script = script.replace('@@BUILDNAME@@', buildName)

    script = script.replace('@@UPDATEURL@@', updateUrl)
    script = script.replace('@@DOWNLOADURL@@', downloadUrl)

    return script


def saveScriptAndMeta(script,fn,metafn):
    with io.open(fn, 'w', encoding='utf8') as f:
        f.write(script)

    with io.open(metafn, 'w', encoding='utf8') as f:
        meta = extractUserScriptMeta(script)
        f.write(meta)


outDir = os.path.join('build', buildName)


# create the build output

# first, delete any existing build
if os.path.exists(outDir):
    shutil.rmtree(outDir)

# copy the 'dist' folder, if it exists
if os.path.exists('dist'):
    # this creates the target directory (and any missing parent dirs)
    # FIXME? replace with manual copy, and any .css and .js files are parsed for replacement tokens?
    shutil.copytree('dist', outDir)
else:
    # no 'dist' folder - so create an empty target folder
    os.makedirs(outDir)


# load main.js, parse, and create main total-conversion-build.user.js
main = readfile('main.js')

downloadUrl = distUrlBase and distUrlBase + '/total-conversion-build.user.js' or 'none'
updateUrl = distUrlBase and distUrlBase + '/total-conversion-build.meta.js' or 'none'
main = doReplacements(main,downloadUrl=downloadUrl,updateUrl=updateUrl)

saveScriptAndMeta(main, os.path.join(outDir,'total-conversion-build.user.js'), os.path.join(outDir,'total-conversion-build.meta.js'))


# for each plugin, load, parse, and save output
os.mkdir(os.path.join(outDir,'plugins'))

for fn in glob.glob("plugins/*.user.js"):
    script = readfile(fn)

    downloadUrl = distUrlBase and distUrlBase + '/' + fn.replace("\\","/") or 'none'
    updateUrl = distUrlBase and downloadUrl.replace('.user.js', '.meta.js') or 'none'
    script = doReplacements(script, downloadUrl=downloadUrl, updateUrl=updateUrl)

    metafn = fn.replace('.user.js', '.meta.js')
    saveScriptAndMeta(script, os.path.join(outDir,fn), os.path.join(outDir,metafn))

def copytree(src, dst, symlinks=False, ignore=None):
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, symlinks, ignore)
        else:
            shutil.copy2(s, d)

# if we're building mobile too
if buildMobile:
    if buildMobile not in ['debug','release']:
        raise Exception("Error: buildMobile must be 'debug' or 'release'")

    # first, copy the IITC script into the mobile folder. create the folder if needed
    try:
        os.makedirs("mobile/assets")
    except:
        pass
    shutil.copy(os.path.join(outDir,"total-conversion-build.user.js"), "mobile/assets/iitc.js")

    # also copy plugins
    try:
        os.makedirs("mobile/assets/plugins")
    except:
        pass
    copytree(os.path.join(outDir,"plugins"), "mobile/assets/plugins")


    # now launch 'ant' to build the mobile project
    retcode = os.system("ant -buildfile mobile/build.xml %s" % buildMobile)

    if retcode != 0:
        print ("Error: mobile app failed to build. ant returned %d" % retcode)
    else:
        shutil.copy("mobile/bin/IITC_Mobile-%s.apk" % buildMobile, os.path.join(outDir,"IITC_Mobile-%s.apk" % buildMobile) )


# vim: ai si ts=4 sw=4 sts=4 et
