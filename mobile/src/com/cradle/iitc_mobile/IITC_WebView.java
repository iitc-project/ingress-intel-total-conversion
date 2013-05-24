package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.GeolocationPermissions;

@SuppressLint("SetJavaScriptEnabled")
public class IITC_WebView extends WebView {

    private WebSettings settings;
    private IITC_WebViewClient webclient;
    private IITC_JSInterface js_interface;
    private boolean disableJS = false;

    // init web view
    private void iitc_init(Context c) {
        if ( this.isInEditMode() ) return;
        settings = this.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setGeolocationEnabled(true);
        settings.setAppCacheEnabled(true);
        settings.setDatabasePath(this.getContext().getApplicationInfo().dataDir
                + "/databases/");
        settings.setAppCachePath(this.getContext().getCacheDir()
                .getAbsolutePath());
        // use cache if on mobile network...saves traffic
        this.js_interface = new IITC_JSInterface(c);
        this.addJavascriptInterface(js_interface, "android");

        this.setWebChromeClient(new WebChromeClient() {
            /**
             * our webchromeclient should share geolocation with the iitc script
             * 
             * allow access by default
             */
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            /**
             * display progress bar in activity
             */
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);

                // maximum for newProgress is 100
                // maximum for setProgress is 10,000
                ((Activity) getContext()).setProgress(newProgress * 100);
            }
        });

        webclient = new IITC_WebViewClient(c);
        this.setWebViewClient(webclient);
    }

    // constructors -------------------------------------------------
    public IITC_WebView(Context context) {
        super(context);

        iitc_init(context);
    }

    public IITC_WebView(Context context, AttributeSet attrs) {
        super(context, attrs);

        iitc_init(context);
    }

    public IITC_WebView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);

        iitc_init(context);
    }

    // ----------------------------------------------------------------

    @Override
    public void loadUrl(String url) {
        // if in edit text mode, don't load javascript otherwise the keyboard closes.
        HitTestResult testResult = this.getHitTestResult();
        if (url.startsWith("javascript:") && testResult != null && testResult.getType() == HitTestResult.EDIT_TEXT_TYPE)
        {
            // let window.show(...) interupt input
            // window.show(...) is called if one of the action bar buttons
            // is clicked
            if (!url.startsWith("javascript: window.show(")) {
                Log.d("iitcm", "in insert mode. do not load script.");
                return;
            }
        }
        // do nothing if script is enabled;
        if (this.disableJS == true) {
            Log.d("iitcm", "javascript injection disabled...return");
            return;
        }
        if (!url.startsWith("javascript:")) {
            // force https if enabled in settings
            SharedPreferences sharedPref = PreferenceManager
                    .getDefaultSharedPreferences(getContext());
            if (sharedPref.getBoolean("pref_force_https", true))
                url = url.replace("http://", "https://");
            else
                url = url.replace("https://", "http://");
            Log.d("iitcm", "loading url: " + url);
        }
        super.loadUrl(url);
    }

    public IITC_WebViewClient getWebViewClient() {
        return this.webclient;
    }

    public IITC_JSInterface getJSInterface() {
        return this.js_interface;
    }

    public void updateCaching() {
        if (!this.isConnectedToWifi()) {
            Log.d("iitcm", "not connected to wifi...load tiles from cache");
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        } else {
            Log.d("iitcm", "connected to wifi...load tiles from network");
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        }
    }

    @TargetApi(Build.VERSION_CODES.JELLY_BEAN)
    private boolean isConnectedToWifi() {
        ConnectivityManager conMan = (ConnectivityManager) getContext()
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo wifi = conMan.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
        // since jelly bean you can mark wifi networks as mobile hotspots
        // settings -> data usage -> menu -> mobile hotspots
        // ConnectivityManager.isActiveNetworkMeter returns if the currently used wifi-network
        // is ticked as mobile hotspot or not.
        // --> IITC_WebView.isConnectedToWifi should return 'false' if connected to mobile hotspot
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            return ((wifi.getState() == NetworkInfo.State.CONNECTED) && !conMan.isActiveNetworkMetered());
        }
        return (wifi.getState() == NetworkInfo.State.CONNECTED);
    }

    public void disableJS(boolean val) {
        this.disableJS = val;
    }

}
