IITC Mobile (IITCM)
===================

```
#     # ####### #######    ######  #######    #    ######  #     #
##    # #     #    #       #     # #         # #   #     #  #   #
# #   # #     #    #       #     # #        #   #  #     #   # #
#  #  # #     #    #       ######  #####   #     # #     #    #
#   # # #     #    #       #   #   #       ####### #     #    #
#    ## #     #    #       #    #  #       #     # #     #    #
#     # #######    #       #     # ####### #     # ######     #
```

- This is **alpha quality** software
- There are more bugs than in all Indiana Jones titles combined
- It will kill your data plan. Caching has been explicitly disabled for testing, so every restart nets you ~500 KiB of code. Since it uses raster maps instead of vector ones, the transfer volume is larger than for Google Maps, too.


### read this guide thoroughly.

How to report bugs
------------------

Be sure to [read the normal guide on how to report bugs](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#how-do-i-report-bugs). In addition, provide these details:
- Android version
- device used (exact name)
- screen size in pixels

**I will close all bug reports without this information without comment.** Gather all information, then make a new issue. It seems you can’t reopen a ticket if I close it, so this is necessary unfortunately.


Can I share this?
-----------------

You may, but only with technically skilled friends. If you do please point them to this page only. Reading these guides ensures only high quality bug reports are made which speeds up development. This is in everyone’s interest, as the time spent on working on bogus reports is not spent on improvements.

Once the app is ready for a broader audience, this will be made easier. For now it should only be used by developers who can help or send in improvements.


How do I…?
----------

- **Login:** on tablets, this should just work. On smartphones you’ll see a black screen with some blue lines. This is the normal Ingress login page and you need to scroll to see the login button.
- **Clear Data/Cache:** Open app launcher and find the IITCM icon. Press-and-hold and then drag it to “App Info” on the top right of the screen. There’s a “clear data” and “clear cache” button.
- **Logout:** Not possible from within the app. See *Clear Data/Cache* and use “clear data”.
- **Reload:** Settings -> Reload IITC.
- **“Your account has not been enabled to play Ingress“**: See *Reload*.
- **Install:** You can find this out yourself. If you don’t know how, then please wait for a more polished version of IITCM.
- **Update:** You can check if there’s a new APK build by looking at [our appspot](https://iitcserv.appspot.com/mobile/). It contains the date of the last update. The app uses the latest IITC hourly build automatically. You may need to clear your cache to force a reload, see *Clear Data/Cache*.

How does this basically work?
-----------------------------

The Android App uses a WebView to render the normal web page. Some code is required to make this work like one would expect, but in a nutshell this is a webbrowser without URL bar. On page load, the app injects `bootstrap.js` which is a specialized loader. While it has some additional checks to make the boot process nicer on slower mobile phones but is mainly required to load vanilla IITC. It’s not possible to load IITC directly due to contraints defined by the injection method. After IITC is injected, it works the same way as on desktop browsers. Tablets are served the desktop version and apart from larger portals there is no change to the GUI. Smartphones execute the code in `code/smartphone.js` and load `smartphone.css`. This is required because their display is too small for the desktop version.

Debugging
---------

If you want to debug the APK, I suggest [reading up on Google’s documentation](https://developer.android.com/index.html).

Debugging IITC(M) **after** it has booted is relatively easy: you can switch to the “debug” tab, which is a low end developer console. It renders all calls to `console.*`, so you can use it just like you expect. It may be easier to develop in a desktop browser. Set it up like explained [in the normal hacking guide](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md), but fake your user agent or modify the detection in `code/smartphone.js` and `main.js`. You don’t need to rebuild the APK to point it to your `iitc-test.user.js` file. Instead, modify `mobile/bootstrap.js` and add yourself with device ID and URL, then [send in a pull request](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#sending-patches). The device ID is printed to the debug console on IITC boot.

Debugging IITC(M) **before** it has booted requires the Android Developer Tools. Connecting your device and running `adb logcat` should print the debug log to your computer until the low-end dev console mentioned above is available. You may need to root your device.


Building the APK
----------------

- **Eclipse:** Just import this project and klick the build button.
- **ant:**
Set the ANDROID_HOME environment variable
    `export ANDROID_HOME=/path/to/android_sdk`
Build the project with ant
    `ant debug`


Download APK
------------

https://iitcserv.appspot.com/mobile/IITC-Mobile-latest.apk

Well, glad you read to the end. Enjoy and send patches, bug reports, postcards and love. (If you are wondering where the download link is, I’m wondering if you have actually read the page.)
