ingress intel total conversion (IITC)
=====================================

Since the [breunigs](https://github.com/breunigs/ingress-intel-total-conversion) IITC branch was deleted,
[Jon Atkins](https://github.com/jonatkins) created this one to continue some development.

## Users

Just want to download/install IITC? Go to http://iitc.me/

For keeping up with the latest news, release announcements, etc, Follow IITC on G+
https://plus.google.com/105383756361375410867/posts

If you have questions, need help or advice with IITC, the Google+ community is a good place to start.
https://plus.google.com/communities/105647403088015055797

Want to report a bug? Post it to the issues page
https://github.com/iitc-project/ingress-intel-total-conversion/issues

## Developers

This Github page is for those interested in developing IITC further.

### Quickstart

To build the browser scripts from source you will need Python (either a late version 2.x, or 3.0+). It should
build correctly on Linux and Windows (and, probably, Macs, FreeBSD, etc)

Fork this project, clone to your local machine.

Run the `build.py local` script to build the code.

If all goes well, output of the build will end up in `build/local` subfolder.

You can create a custom build settings file, `localbuildsettings.py` - look in the supplied
`buildsettings.py` for details.

#### Mobile

To build the mobile app, along with python, you will need

- The Java JDK (development kit - the runtime JRE is not enough)
- The Android SDK

Run `build.py mobile` to build IITC Mobile in debug mode.

Note that part of the build.py process includes copying the IITC script files into the `mobile/res` subfolder.
If this isn't done (e.g. you build IITC Mobile directly from Eclipse) you will end up with a broken build.
