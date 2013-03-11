How does this basically work?
-----------------------------

At the moment, the Android App is nothing more then a WebView which renders the normal web page. The IITC script is injected on page load and after this, it works the same way as on desktop browser. More functionality will be added soon...

Debugging
---------

If you want to debug the APK, I suggest [reading up on Google’s documentation](https://developer.android.com/index.html).

Debugging IITC(M) **after** it has booted is relatively easy: you can switch to the “debug” tab, which is a low end developer console. It renders all calls to `console.*`, so you can use it just like you expect. It may be easier to develop in a desktop browser. Set it up like explained [in the normal hacking guide](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md), but fake your user agent or modify the detection in `code/smartphone.js` and `main.js`. The device ID is printed to the debug console on IITC boot.

Debugging IITC(M) **before** it has booted requires the Android Developer Tools. Connecting your device and running `adb logcat` should print the debug log to your computer until the low-end dev console mentioned above is available. 


Building the APK
----------------

- **Eclipse:** Just import this project and klick the build button.
- **ant:**
  Set the ANDROID_HOME environment variable:
  ```export ANDROID_HOME=/path/to/android_sdk```
  and build the project with ant:
  `ant debug`
- You can use `build_mobile.js`, too, which builds IITC, compresses
  it and uses ant to build a release APK of IITCM. It requires that
  you have Python and uglifyjs installed. You need to set the
  `ANDROID_HOME`, like explained above.
