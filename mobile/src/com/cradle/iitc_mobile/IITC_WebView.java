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
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.cradle.iitc_mobile.async.CheckHttpResponse;

@SuppressLint("SetJavaScriptEnabled")
public class IITC_WebView extends WebView {

    private WebSettings mSettings;
    private IITC_WebViewClient mIitcWebViewClient;
    private IITC_JSInterface mJsInterface;
    private Context mContext;
    private SharedPreferences mSharedPrefs;
    private boolean mDisableJs = false;
    private String mDefaultUserAgent;
    private final String mDesktopUserAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:17.0)" +
            " Gecko/20130810 Firefox/17.0 Iceweasel/17.0.8";


    // init web view
    private void iitc_init(Context c) {
        if (isInEditMode()) return;
        mContext = c;
        mSettings = getSettings();
        mSettings.setJavaScriptEnabled(true);
        mSettings.setDomStorageEnabled(true);
        mSettings.setAllowFileAccess(true);
        mSettings.setGeolocationEnabled(true);
        mSettings.setAppCacheEnabled(true);
        mSettings.setDatabasePath(getContext().getApplicationInfo().dataDir + "/databases/");
        mSettings.setAppCachePath(getContext().getCacheDir().getAbsolutePath());
        mJsInterface = new IITC_JSInterface((IITC_Mobile) mContext);
        addJavascriptInterface(mJsInterface, "android");
        mSharedPrefs = PreferenceManager.getDefaultSharedPreferences(mContext);
        mDefaultUserAgent = mSettings.getUserAgentString();
        setUserAgent();

        setWebChromeClient(new WebChromeClient() {
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

            /**
             * remove splash screen if any JS error occurs
             */
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                if (consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                    ((IITC_Mobile) getContext()).setLoadingState(false);
                }
                return super.onConsoleMessage(consoleMessage);
            }
        });

        mIitcWebViewClient = new IITC_WebViewClient(c);
        setWebViewClient(mIitcWebViewClient);
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
        HitTestResult testResult = getHitTestResult();
        if (url.startsWith("javascript:") && testResult != null &&
                testResult.getType() == HitTestResult.EDIT_TEXT_TYPE) {
            // let window.show(...) interupt input
            // window.show(...) is called if one of the action bar buttons
            // is clicked
            if (!url.startsWith("javascript: window.show(")) {
                Log.d("iitcm", "in insert mode. do not load script.");
                return;
            }
        }
        // do nothing if script is enabled;
        if (mDisableJs) {
            Log.d("iitcm", "javascript injection disabled...return");
            return;
        }
        if (!url.startsWith("javascript:")) {
            // force https if enabled in settings
            SharedPreferences sharedPref = PreferenceManager
                    .getDefaultSharedPreferences(getContext());
            if (sharedPref.getBoolean("pref_force_https", true)) {
                url = url.replace("http://", "https://");
            } else {
                url = url.replace("https://", "http://");
            }

            // disable splash screen if a http error code is responded
            new CheckHttpResponse(mJsInterface, mContext).execute(url);
            Log.d("iitcm", "loading url: " + url);
        }
        super.loadUrl(url);
    }

    public IITC_WebViewClient getWebViewClient() {
        return mIitcWebViewClient;
    }

    public IITC_JSInterface getJSInterface() {
        return mJsInterface;
    }

    public void updateCaching(boolean login) {
        switch (Integer.parseInt(mSharedPrefs.getString("pref_caching", "1"))) {
            case 0:
                mSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                break;
            case 2:
                mSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
                break;
            default:
                if (getUrl() != null) {
                    login |= getUrl().contains("accounts.google.com");
                }
                // use cache if on mobile network...saves traffic
                if (!isConnectedToWifi() && !login) {
                    Log.d("iitcm", "not connected to wifi...load tiles from cache");
                    mSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                } else {
                    if (login) {
                        Log.d("iitcm", "login...load tiles from network");
                    } else {
                        Log.d("iitcm", "connected to wifi...load tiles from network");
                    }
                    mSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
                }
                break;
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
            return ((wifi.getState() == NetworkInfo.State.CONNECTED) &&
                    !conMan.isActiveNetworkMetered());
        }
        return (wifi.getState() == NetworkInfo.State.CONNECTED);
    }

    public void disableJS(boolean val) {
        mDisableJs = val;
    }

    public void setUserAgent() {
        String ua = mSharedPrefs.getBoolean("pref_fake_user_agent", false) ? mDesktopUserAgent : mDefaultUserAgent;
        Log.d("iitcm", "setting user agent to: " + ua);
        mSettings.setUserAgentString(ua);
    }

}
