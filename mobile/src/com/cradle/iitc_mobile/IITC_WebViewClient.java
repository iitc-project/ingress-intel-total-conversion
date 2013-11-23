package com.cradle.iitc_mobile;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.util.Log;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import com.cradle.iitc_mobile.async.UrlContentToString;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class IITC_WebViewClient extends WebViewClient {

    private static final ByteArrayInputStream STYLE = new ByteArrayInputStream(
            "body, #dashboard_container, #map_canvas { background: #000 !important; }"
                    .getBytes());
    private static final ByteArrayInputStream EMPTY = new ByteArrayInputStream(
            "".getBytes());

    private String mIitcScript = null;
    private String mIitcPath = null;
    private boolean mIitcInjected = false;
    private final Context mContext;

    public IITC_WebViewClient(Context c) {
        this.mContext = c;
        this.mIitcPath = Environment.getExternalStorageDirectory().getPath()
                + "/IITC_Mobile/";
    }

    public String getIITCVersion() {
        HashMap<String, String> map = getScriptInfo(mIitcScript);
        return map.get("version");
    }

    // static method because we use it in IITC_PluginPreferenceActivity too
    public static HashMap<String, String> getScriptInfo(String js) {
        HashMap<String, String> map = new HashMap<String, String>();
        String header = "";
        if (js != null) {
            header = js.substring(js.indexOf("==UserScript=="),
                    js.indexOf("==/UserScript=="));
        }
        // remove new line comments
        header = header.replace("\n//", " ");
        // get a list of key-value
        String[] attributes = header.split("  +");
        // add default values
        map.put("version", "not found");
        map.put("name", "unknown");
        map.put("description", "");
        map.put("category", "Misc");
        // add parsed values
        for (int i = 0; i < attributes.length; i++) {
            // search for attributes and use the value
            if (attributes[i].equals("@version")) {
                map.put("version", attributes[i + 1]);
            }
            if (attributes[i].equals("@name")) {
                map.put("name", attributes[i + 1]);
            }
            if (attributes[i].equals("@description")) {
                map.put("description", attributes[i + 1]);
            }
            if (attributes[i].equals("@category")) {
                map.put("category", attributes[i + 1]);
            }
        }
        return map;
    }

    public String getGmInfoJson(HashMap<String, String> map) {
        JSONObject jObject = new JSONObject(map);
        return "{\"script\":" + jObject.toString() + "}";
    }

    public void loadIITC_JS(Context c) throws java.io.IOException {
        // You are able to load the script from external source
        // if a http address is given, use script from this address. else use
        // the local script
        SharedPreferences sharedPref = PreferenceManager
                .getDefaultSharedPreferences(c);
        String iitc_source = sharedPref.getString("pref_iitc_source", "local");
        String js = "";

        // if developer mode are enabled, load all iitc script from external
        // storage
        Log.d("iitcm", "adding iitc main script");
        if (sharedPref.getBoolean("pref_dev_checkbox", false)) {
            js = this.fileToString(mIitcPath
                    + "dev/total-conversion-build.user.js", false);
            if (js.equals("false")) {
                Toast.makeText(mContext, "File " + mIitcPath +
                        "dev/total-conversion-build.user.js not found. " +
                        "Disable developer mode or add iitc files to the dev folder.",
                        Toast.LENGTH_LONG).show();
                return;
            } else {
                Toast.makeText(mContext, "Developer mode enabled",
                        Toast.LENGTH_SHORT).show();
            }
        } else {
            // load iitc script from web or asset folder
            if (iitc_source.contains("http")) {
                URL url = new URL(iitc_source);
                // if parsing of the online iitc source timed out, use the script from assets
                try {
                    js = new UrlContentToString().execute(url).get(5, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                    js = this.fileToString("total-conversion-build.user.js", true);
                } catch (ExecutionException e) {
                    e.printStackTrace();
                    js = this.fileToString("total-conversion-build.user.js", true);
                } catch (TimeoutException e) {
                    e.printStackTrace();
                    js = this.fileToString("total-conversion-build.user.js", true);
                }
            } else {
                js = this.fileToString("total-conversion-build.user.js", true);
            }
            mIitcInjected = false;
        }

        PackageManager pm = mContext.getPackageManager();
        boolean hasMultitouch = pm
                .hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN_MULTITOUCH);
        boolean forcedZoom = sharedPref.getBoolean("pref_user_zoom", false);
        if (hasMultitouch && !forcedZoom) {
            js = js.replace("window.showZoom = true;",
                    "window.showZoom = false;");
        }

        // hide layer chooser on desktop mode
        // on mobile mode it is hidden via smartphone.css
        boolean desktopMode = sharedPref.getBoolean("pref_force_desktop", false);
        if (desktopMode) {
            js = js.replace("window.showLayerChooser = true;",
                    "window.showLayerChooser = false");
        }

        String gmInfo = "GM_info=" + getGmInfoJson(getScriptInfo(js)) + "\n";
        this.mIitcScript = gmInfo + js;

    }

    // enable https
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler,
                                   SslError error) {
        handler.proceed();
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        if (url.startsWith("http://www.ingress.com/intel")
                || url.startsWith("https://www.ingress.com/intel")) {
            if (mIitcInjected) return;
            Log.d("iitcm", "injecting iitc..");
            view.loadUrl("javascript: " + this.mIitcScript);
            mIitcInjected = true;
            loadPlugins(view);
        }
        super.onPageFinished(view, url);
    }

    /**
     * this method is called automatically when the Google login form is opened.
     */
    @Override
    public void onReceivedLoginRequest(WebView view, String realm, String account, String args) {
        Log.d("iitcm", "Login requested: " + realm + " " + account + " " + args);
        Log.d("iitcm", "logging in...updating caching mode");
        ((IITC_WebView) view).updateCaching(true);
        mIitcInjected = false;
        //((IITC_Mobile) mContext).onReceivedLoginRequest(this, view, realm, account, args);
    }

    public void loadPlugins(WebView view) {
        // get the plugin preferences
        SharedPreferences sharedPref = PreferenceManager
                .getDefaultSharedPreferences(mContext);
        boolean dev_enabled = sharedPref.getBoolean("pref_dev_checkbox", false);
        String path = (dev_enabled) ? mIitcPath + "dev/plugins/" : "plugins/";

        Map<String, ?> all_prefs = sharedPref.getAll();

        // iterate through all plugins
        for (Map.Entry<String, ?> entry : all_prefs.entrySet()) {
            String plugin = entry.getKey();
            if (plugin.endsWith("user.js") && entry.getValue().toString().equals("true")) {
                if (!plugin.startsWith(mIitcPath)) {
                    // load default iitc plugins
                    Log.d("iitcm", "adding plugin " + plugin);
                    loadJS(path + plugin, !dev_enabled, view);
                } else {
                    // load user iitc plugins
                    Log.d("iitcm", "adding user plugin " + plugin);
                    loadJS(plugin, false, view);
                }
            }
        }

        // inject the user location script if enabled in settings
        if (sharedPref.getBoolean("pref_user_loc", false)) {
            path = path.replace("plugins/", "");
            loadJS(path + "user-location.user.js", !dev_enabled, view);
        }
    }

    // read a file into a string
    // load it as javascript
    public boolean loadJS(String file, boolean asset, WebView view) {
        String js = fileToString(file, asset);
        if (js.equals("false")) {
            return false;
        } else {
            String gmInfo = "GM_info=" + getGmInfoJson(getScriptInfo(js)) + "\n";
            view.loadUrl("javascript:" + gmInfo + js);
        }
        return true;
    }

    // read a file into a string
    // use the full path for File
    // if asset == true use the asset manager to open file
    public String fileToString(String file, boolean asset) {
        Scanner s = null;
        String src = "";
        if (!asset) {
            File js_file = new File(file);
            try {
                s = new Scanner(js_file).useDelimiter("\\A");
            } catch (FileNotFoundException e) {
                e.printStackTrace();
                Log.d("iitcm", "failed to parse file " + file);
                return "false";
            }
        } else {
            // load plugins from asset folder
            AssetManager am = mContext.getAssets();
            try {
                s = new Scanner(am.open(file)).useDelimiter("\\A");
            } catch (IOException e) {
                e.printStackTrace();
                Log.d("iitcm", "failed to parse file assets/" + file);
                return "false";
            }
        }

        if (s != null) {
            src = s.hasNext() ? s.next() : "";
        }
        return src;
    }

    // Check every external resource if it’s okay to load it and maybe replace
    // it
    // with our own content. This is used to block loading Niantic resources
    // which aren’t required and to inject IITC early into the site.
    // via http://stackoverflow.com/a/8274881/1684530
    @Override
    public WebResourceResponse shouldInterceptRequest(final WebView view,
                                                      String url) {
        if (url.contains("/css/common.css")) {
            return new WebResourceResponse("text/css", "UTF-8", STYLE);
//        } else if (url.contains("gen_dashboard.js")) {
//            // define initialize function to get rid of JS ReferenceError on intel page's 'onLoad'
//            String gen_dashboard_replacement = "window.initialize = function() {}";
//            return new WebResourceResponse("text/javascript", "UTF-8",
//                    new ByteArrayInputStream(gen_dashboard_replacement.getBytes()));
        } else if (url.contains("/css/ap_icons.css")
                || url.contains("/css/map_icons.css")
                || url.contains("/css/common.css")
                || url.contains("/css/misc_icons.css")
                || url.contains("/css/style_full.css")
                || url.contains("/css/style_mobile.css")
                || url.contains("/css/portalrender.css")
                || url.contains("/css/portalrender_mobile.css")
                || url.contains("js/analytics.js")
                || url.contains("google-analytics.com/ga.js")) {
            return new WebResourceResponse("text/plain", "UTF-8", EMPTY);
        } else {
            return super.shouldInterceptRequest(view, url);
        }
    }

    // start non-ingress-intel-urls in another app...
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (url.contains("ingress.com") || url.contains("appengine.google.com")) {
            // reload iitc if a poslink is clicked inside the app
            if (url.contains("intel?ll=")
                    || (url.contains("latE6") && url.contains("lngE6"))) {
                Log.d("iitcm",
                        "should be an internal clicked position link...reload script for: "
                                + url);
                ((IITC_Mobile) mContext).loadUrl(url);
            }
            if (url.contains("logout")) {
                Log.d("iitcm", "logging out...updating caching mode");
                ((IITC_WebView) view).updateCaching(true);
            }
            return false;
        } else {
            Log.d("iitcm",
                    "no ingress intel link, start external app to load url: "
                            + url);
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            mContext.startActivity(intent);
            return true;
        }
    }
}
