package com.cradle.iitc_mobile;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.text.TextUtils;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class IITC_WebViewClient extends WebViewClient {

    private static final ByteArrayInputStream STYLE = new ByteArrayInputStream(
            "body, #dashboard_container, #map_canvas { background: #000 !important; }"
                    .getBytes());
    private static final ByteArrayInputStream EMPTY = new ByteArrayInputStream("".getBytes());
    private static final String DOMAIN = IITC_FileManager.DOMAIN;

    private final String mIitcPath;
    private boolean mIitcInjected = false;
    private final IITC_Mobile mIitc;
    private final IITC_TileManager mTileManager;

    public IITC_WebViewClient(final IITC_Mobile iitc) {
        mIitc = iitc;
        mTileManager = new IITC_TileManager(mIitc);
        mIitcPath = Environment.getExternalStorageDirectory().getPath() + "/IITC_Mobile/";
    }

    // enable https
    @Override
    public void onReceivedSslError(final WebView view, final SslErrorHandler handler, final SslError error) {
        handler.proceed();
    }

    @Override
    public void onPageFinished(final WebView view, final String url) {
        if (url.startsWith("http://www.ingress.com/intel")
                || url.startsWith("https://www.ingress.com/intel")) {
            if (mIitcInjected) return;
            Log.d("injecting iitc..");
            loadScripts((IITC_WebView) view);
            mIitcInjected = true;
        }
        super.onPageFinished(view, url);
    }

    private void loadScripts(final IITC_WebView view) {
        final List<String> scripts = new LinkedList<String>();

        scripts.add("script" + DOMAIN + "/total-conversion-build.user.js");

        // get the plugin preferences
        final SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mIitc);
        final Map<String, ?> all_prefs = sharedPref.getAll();

        // iterate through all plugins
        for (final Map.Entry<String, ?> entry : all_prefs.entrySet()) {
            final String plugin = entry.getKey();
            if (plugin.endsWith(".user.js") && entry.getValue().toString().equals("true")) {
                if (plugin.startsWith(mIitcPath)) {
                    scripts.add("user-plugin" + DOMAIN + plugin);
                } else {
                    scripts.add("script" + DOMAIN + "/plugins/" + plugin);
                }
            }
        }

        // inject the user location script if enabled in settings
        if (Integer.parseInt(sharedPref.getString("pref_user_location_mode", "0")) != 0) {
            scripts.add("script" + DOMAIN + "/user-location.user.js");
        }

        final String js = "(function(){['" + TextUtils.join("','", scripts) + "'].forEach(function(src) {" +
                "var script = document.createElement('script');script.src = '//'+src;" +
                "(document.body || document.head || document.documentElement).appendChild(script);" +
                "});})();";

        view.loadJS(js);
    }

    /**
     * this method is called automatically when the Google login form is opened.
     */
    @Override
    public void onReceivedLoginRequest(final WebView view, final String realm, final String account, final String args) {
        mIitcInjected = false;
        // Log.d("iitcm", "Login requested: " + realm + " " + account + " " + args);
        // ((IITC_Mobile) mContext).onReceivedLoginRequest(this, view, realm, account, args);
    }

    /**
     * Check every external resource if it's okay to load it and maybe replace it with our own content.
     * This is used to block loading Niantic resources which aren’t required and to inject IITC early into the site.
     * via http://stackoverflow.com/a/8274881/1684530
     */
    @Override
    public WebResourceResponse shouldInterceptRequest(final WebView view, final String url) {
        // if any tiles are requested, handle it with IITC_TileManager
        if (url.matches(".*tile.*jpg.*") // mapquest tiles | ovi tiles
                || url.matches(".*tile.*png.*") // cloudmade tiles
                || url.matches(".*mts.*googleapis.*smartmaps") // google tiles
                || url.matches(".*khms.*googleapis.*") // google satellite tiles
                || url.matches(".*tile.*jpeg.*") // bing tiles
                || url.matches(".*maps.*yandex.*tiles.*") // yandex maps
        ) {
            try {
                return mTileManager.getTile(url);
            } catch (final Exception e) {
                Log.w(e);
                return super.shouldInterceptRequest(view, url);
            }
        }

        if (url.contains("/css/common.css")) {
            // return custom stylesheet
            return new WebResourceResponse("text/css", "UTF-8", STYLE);
        }

        if (url.contains("/css/ap_icons.css")
                || url.contains("/css/map_icons.css")
                || url.contains("/css/common.css")
                || url.contains("/css/misc_icons.css")
                || url.contains("/css/style_full.css")
                || url.contains("/css/style_mobile.css")
                || url.contains("/css/portalrender.css")
                || url.contains("/css/portalrender_mobile.css")
                || url.contains("js/analytics.js")
                || url.contains("google-analytics.com/ga.js")) {
            // don't load stylesheets
            return new WebResourceResponse("text/plain", "UTF-8", EMPTY);
        }

        final Uri uri = Uri.parse(url);
        if (uri.getHost() != null && uri.getHost().endsWith(DOMAIN) &&
                ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())))
            return mIitc.getFileManager().getResponse(uri);

        return super.shouldInterceptRequest(view, url);
    }

    // start non-ingress-intel-urls in another app...
    @Override
    public boolean shouldOverrideUrlLoading(final WebView view, final String url) {
        if (url.contains("ingress.com") || url.contains("appengine.google.com")) {
            // reload iitc if a poslink is clicked inside the app
            if (url.contains("intel?ll=")
                    || (url.contains("latE6") && url.contains("lngE6"))) {
                Log.d("should be an internal clicked position link...reload script for: " + url);
                mIitc.loadUrl(url);
            }
            return false;
        } else {
            Log.d("no ingress intel link, start external app to load url: " + url);
            final Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            mIitc.startActivity(intent);
            return true;
        }
    }

    public void reset() {
        mIitcInjected = false;
    }
}
