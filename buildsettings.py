# settings file for builds.

# if you want to have custom builds, copy this file to "localbuildsettings.py" and make changes there.

# possible fields:
# resourceBaseUrl - optional - the URL base for external resources (all resources embedded in standard IITC)
# distUrlBase - optional - the base URL to use for update checks
# buildMobile - optional - if set, mobile builds are built with 'ant'. requires the Android SDK and appropriate mobile/local.properties file configured
# preBuild - optional - an array of strings to run as commands, via os.system, before building the scripts
# postBuild - optional - an array of string to run as commands, via os.system, after all builds are complete


buildSettings = {
    # local: use this build if you're not modifying external resources
    # no external resources allowed - they're not needed any more
    'local': {
        'resourceUrlBase': None,
        'distUrlBase': None,
    },

    # local8000: if you need to modify external resources, this build will load them from
    # the web server at http://0.0.0.0:8000/dist
    # (This shouldn't be required any more - all resources are embedded. but, it remains just in case some new feature
    #  needs external resources)
    'local8000': {
        'resourceUrlBase': 'http://0.0.0.0:8000/dist',
        'distUrlBase': None,
    },

    # mobile: default entry that also builds the mobile .apk
    # you will need to have the android-sdk installed, and the file mobile/local.properties created as required
    'mobile': {
        'resourceUrlBase': None,
        'distUrlBase': None,
        'buildMobile': 'debug',
    },


    # if you want to publish your own fork of the project, and host it on your own web site
    # create a localbuildsettings.py file containing something similar to this
    # note: Firefox+Greasemonkey require the distUrlBase to be "https" - they won't check for updates on regular "http" URLs
    #'example': {
    #    'resourceBaseUrl': 'http://www.example.com/iitc/dist',
    #    'distUrlBase': 'https://secure.example.com/iitc/dist',
    #},


}



# defaultBuild - the name of the default build to use if none is specified on the build.py command line
# (in here as an example - it only works in localbuildsettings.py)
#defaultBuild = 'local'
