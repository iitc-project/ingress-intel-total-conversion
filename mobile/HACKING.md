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
