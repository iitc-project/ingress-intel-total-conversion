# settings file for builds.

# if you want to have custom builds, copy this file to "localbuildsettings.py" and make changes there.

buildSettings = {
    # local: use this build if you're not modifying external resources
    # external resources will be loaded from the public live release
    'local': {
        'resourceUrlBase': 'http://iitc.jonatkins.com/release',
        'distUrlBase': None,
    },

    # local8000: if you need to modify external resources, this build will load them from
    # the web server at http://0.0.0.0:8000/dist
    'local8000': {
        'resourceUrlBase': 'http://0.0.0.0:8000/dist',
        'distUrlBase': None,
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
