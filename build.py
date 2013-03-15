#!/usr/bin/env python

import glob
import time
import re
import io
import base64
import sys
import os
import shutil


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
resourceUrlBase = settings['resourceUrlBase']
distUrlBase = settings['distUrlBase']



def readfile(fn):
    with io.open(fn, 'Ur', encoding='utf8') as f:
        return f.read()

def loaderString(var):
    fn = var.group(1)
    return readfile(fn).replace('\n', '\\n').replace('\'', '\\\'')

def loaderRaw(var):
    fn = var.group(1)
    return readfile(fn)

def loaderImage(var):
    fn = var.group(1)
    return 'data:image/png;base64,{0}'.format(str(base64.encodestring(open(fn, 'rb').read())).replace('\n', ''))

def loadCode(ignore):
    return '\n\n'.join(map(readfile, glob.glob('code/*')))


def extractUserScriptMeta(var):
    m = re.search ( r"//[ \t]*==UserScript==\n.*?//[ \t]*==/UserScript==\n", var, re.MULTILINE|re.DOTALL )
    return m.group(0)



def doReplacements(script,updateUrl,downloadUrl):

    script = re.sub('@@INJECTCODE@@',loadCode,script)

    script = re.sub('@@INCLUDERAW:([0-9a-zA-Z_./-]+)@@', loaderRaw, script)
    script = re.sub('@@INCLUDESTRING:([0-9a-zA-Z_./-]+)@@', loaderString, script)
    script = re.sub('@@INCLUDEIMAGE:([0-9a-zA-Z_./-]+)@@', loaderImage, script)

    script = script.replace('@@BUILDDATE@@', buildDate)
    script = script.replace('@@DATETIMEVERSION@@', dateTimeVersion)
    script = script.replace('@@RESOURCEURLBASE@@', resourceUrlBase)
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

# copy the 'dist' folder - this creates the target directory (and any missing parent dirs)
# FIXME? replace with manual copy, and any .css and .js files are parsed for replacement tokens?
shutil.copytree('dist', outDir)



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


# vim: ai si ts=4 sw=4 sts=4 et
