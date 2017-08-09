How does this basically work?
-----------------------------

At the moment, the Android App is a WebView which renders the normal web page. The IITC script is injected by calling ```iitc_view.loadIITC_JS(Context)```. The app uses a local version of the script, which is located in the assets folder.
Communication from app to script is handled by loading Javascript function calls. For example: ```iitc_view.loadUrl("javascript: window.alert('foo');");```

Communication from script to app is handled by the JavascriptInterface (see /mobile/src/com/cradle/iitc\_mobile/IITC_JSInterface.java). If a method ```foo(String)``` is defined in JSInterface, it can be called by ```android.foo("Hello World")``` in the IITC script.

Developing IITC and Plugins for IITC Mobile
-------------------------------------------

The developer mode can be enabled in the settings. Create a folder ```IITC_Mobile/dev/``` on your external storage of your Android device and copy the sources from ```$IITC_folder/build/mobile/``` to it. If the developer mode is enabled all sources will be loaded from there.

Debugging
---------

If you want to debug the APK, I suggest [reading up on Google’s documentation](https://developer.android.com/index.html).

Debugging IITC(M) **after** it has booted is relatively easy: you can switch to the “debug” tab, which is a low end developer console. It renders all calls to `console.*`, so you can use it just like you expect. It may be easier to develop in a desktop browser. Set it up like explained [in the normal hacking guide](https://github.com/iitc-project/ingress-intel-total-conversion/blob/master/HACKING.md), but fake your user agent or modify the detection in `code/smartphone.js` and `main.js`. The device ID is printed to the debug console on IITC boot.

Debugging IITC(M) **before** it has booted requires the Android Developer Tools. Connecting your device and running `adb logcat` should print the debug log to your computer until the low-end dev console mentioned above is available. 


Building the APK
----------------

- **ant:**
  Set the ANDROID_HOME environment variable:
  ```export ANDROID_HOME=/path/to/android_sdk```
  Then build the app via the build.py script ```./build.py mobile```
- **Eclipse:** Just import this project and klick the build button. Ensure that you have total-conversion-build.user.js and user-location.user.js in your assets folder. This is automatically created, when executing ```./build.py mobile```. Otherwise, just copy the scripts to the assets folder.
