These files are stored here as reference and backup for me. You likely
won’t need them, as the script runs on one of my servers and handles all
the building for you.

Still, here’s how it goes down:
- `iitc-nightly.sh` is run by a cronjob. Config: `50 1 * * * /home/pi/iitc-nightly.sh > /dev/null`
- the ZSH script grabs the latest IITC tarball and extracts it
- it gets the latest revision sha1
- builds
- uploads to Dropbox using [Dropbox-Up](https://github.com/andreafabrizi/Dropbox-Uploader)
- wild copy magic to get the correct folder structure for app engine
- uploading to app engine using Google’s appcfg.sh script (available [in the Java AppEngine SDK](https://developers.google.com/appengine/downloads))


You don’t need the whole app engine folder, only some files *and folders*.
The directory structure is shown below where `./appenginesmall/bin/appcfg.sh update war`
will update all files in `war/` without `war/WEB-INF`.

```
~/iitc-appengine $ tree
.
├── appenginesmall
│   ├── bin
│   │   └── appcfg.sh
│   ├── config
│   │   └── sdk
│   │       └── logging.properties
│   ├── docs
│   │   └── appengine-web.xsd
│   └── lib
│       ├── appengine-tools-api.jar
│       ├── impl
│       │   └── agent
│       ├── opt
│       │   └── tools
│       │       └── appengine-local-endpoints
│       │           └── v1
│       ├── shared
│       │   └── jsp
│       ├── tools
│       │   └── jsp
│       └── user
└── war
    ├── dist
    │   ├── …
    ├── iitc-nightly
    │   ├── iitc-nightly-latest.user.js
    │   └── …
    ├── images
    │   ├── …
    ├── screenshots
    │   ├── …
    └── WEB-INF
        ├── appengine-web.xml
        └── web.xml
```
