"""
Settings file for builds.

If you want to have custom builds, copy this file to "localbuildsettings.py"
and make changes there.

Possible Fields:

    resourceBaseUrl (optional): The URL base for external resources
        (all resources embedded in standard IITC).

    distUrlBase (optional): The base URL to use for update checks.

    buildMobile (optional): If set, mobile builds are built with 'ant'.
        Requires the Android SDK and appropriate mobile/local.properties
        file configured.

    preBuild (optional): An array of strings to run as commands,
        via os.system, before building the scripts.

    postBuild (optional): An array of string to run as commands,
        via os.system, after all builds are complete.
"""

buildSettings = {
    # local: use this build if you're not modifying external resources
    #       no external resources allowed - they're not needed any more
    'local': {
        'resourceUrlBase': None,
        'distUrlBase': None,
    },

    # local8000: if you need to modify external resources,
    #           this build will load them from the web server at
    #           http://0.0.0.0:8000/dist
    #           (This shouldn't be required any more - all resources
    #            are embedded. but, it remains just in case some new
    #            feature needs external resources)
    'local8000': {
        'resourceUrlBase': 'http://0.0.0.0:8000/dist',
        'distUrlBase': None,
    },

    # mobile: default entry that also builds the mobile .apk
    #        you will need to have the android-sdk installed, and
    #        the file mobile/local.properties created as required
    'mobile': {
        'resourceUrlBase': None,
        'distUrlBase': None,
        'buildMobile': 'debug',
    },

    # example: If you want to publish your own fork of the project, and host it
    #          on your own web site create a localbuildsettings.py file
    #          containing something similar to this.
    #
    #          NOTE: Firefox+Greasemonkey require the distUrlBase to be "https"
    #          They will not check for updates on regular "http" URLs.
    # 'example': {
    #    'resourceBaseUrl': 'http://www.example.com/iitc/dist',
    #    'distUrlBase': 'https://secure.example.com/iitc/dist',
    # },
}

"""
defaultBuild - the name of the default build to use if none is
               specified on the build.py command line
               (in here as an example - it only works in localbuildsettings.py)
"""
# defaultBuild = 'local'
