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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;
import java.util.Map;
import java.util.Scanner;

public class IITC_WebViewClient extends WebViewClient {
    private static final ByteArrayInputStream style = new ByteArrayInputStream(
            "body, #dashboard_container, #map_canvas { background: #000 !important; }"
                    .getBytes());
    private static final ByteArrayInputStream empty = new ByteArrayInputStream(
            "".getBytes());

    private WebResourceResponse iitcjs;
    private String js = null;
    private String iitc_path = null;
    private final Context context;

    public IITC_WebViewClient(Context c) {
        this.context = c;
        this.iitc_path = Environment.getExternalStorageDirectory().getPath()
                + "/IITC_Mobile/";
    }

    public String getIITCVersion() {
        String header = "";
        if (js != null)
            header = js.substring(js.indexOf("==UserScript=="),
                    js.indexOf("==/UserScript=="));
        // remove new line comments
        header = header.replace("\n//", "");
        // get a list of key-value
        String[] attributes = header.split(" +");
        String iitc_version = "not found";
        for (int i = 0; i < attributes.length; i++) {
            // search for version and use the value
            if (attributes[i].equals("@version"))
                iitc_version = attributes[i + 1];
        }
        return iitc_version;
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
            js = this.fileToString(iitc_path
                    + "dev/total-conversion-build.user.js", false);
            if (js.equals("false")) {
                Toast.makeText(context, "File " + iitc_path +
                        "dev/total-conversion-build.user.js not found. " +
                        "Disable developer mode or add iitc files to the dev folder.",
                        Toast.LENGTH_LONG).show();
                return;
            } else {
                Toast.makeText(context, "Developer mode enabled",
                        Toast.LENGTH_SHORT).show();
            }
        } else {
            // load iitc script from web or asset folder
            if (iitc_source.contains("http")) {
                URL url = new URL(iitc_source);
                js = new Scanner(url.openStream(), "UTF-8").useDelimiter("\\A")
                        .next();
            } else {
                js = this.fileToString("total-conversion-build.user.js", true);
            }
        }

        PackageManager pm = context.getPackageManager();
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
        // add all plugins to the script...inject plugins + main script simultaneously
        js += parsePlugins();
        this.js = js;

        // need to wrap the mobile iitc.js version in a document ready. IITC
        // expects to be injected after the DOM has been loaded completely.
        // Since the mobile client injects IITC by replacing the gen_dashboard
        // file, IITC runs to early. The document.ready delays IITC long enough
        // so it boots correctly.
        js = "$(document).ready(function(){" + js + "});";

        iitcjs = new WebResourceResponse("text/javascript", "UTF-8",
                new ByteArrayInputStream(js.getBytes()));
    }

    // enable https
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler,
                                   SslError error) {
        handler.proceed();
    }

    /**
     * this method is called automatically when the Google login form is opened.
     */
    @Override
    public void onReceivedLoginRequest(WebView view, String realm, String account, String args) {
        Log.d("iitcm", "Login requested: " + realm + " " + account + " " + args);
        ((IITC_Mobile) context).onReceivedLoginRequest(this, view, realm, account, args);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        if (url.contains("accounts.google.com")) {
            Log.d("iitcm", "reload after login/logout");
            IITC_Mobile main_activity = ((IITC_Mobile) context);
            main_activity.handleMenuItemSelected(R.id.reload_button);
            return;
        }
        super.onPageFinished(view, url);
    }

    // parse all enabled iitc plugins
    // returns a string containing all plugins without their wrappers
    public String parsePlugins() {
        String js = "";
        // get the plugin preferences
        SharedPreferences sharedPref = PreferenceManager
                .getDefaultSharedPreferences(context);
        boolean dev_enabled = sharedPref.getBoolean("pref_dev_checkbox", false);

        Map<String, ?> all_prefs = sharedPref.getAll();

        // iterate through all plugins
        for (Map.Entry<String, ?> entry : all_prefs.entrySet()) {
            String plugin = entry.getKey();
            if (plugin.endsWith("user.js") && entry.getValue().toString().equals("true")) {
                // load default iitc plugins
                if (!plugin.startsWith(iitc_path)) {
                    Log.d("iitcm", "adding plugin " + plugin);
                    if (dev_enabled)
                        js += this.removePluginWrapper(iitc_path + "dev/plugins/"
                                + plugin, false);
                    else
                        js += this.removePluginWrapper("plugins/" + plugin, true);
                    // load additional iitc plugins
                } else {
                    Log.d("iitcm", "adding additional plugin " + plugin);
                    js += this.removePluginWrapper(plugin, false);
                }
            }
        }

        // inject the user location script if enabled in settings
        if (sharedPref.getBoolean("pref_user_loc", false))
            js += parseTrackingPlugin(dev_enabled);

        return js;
    }

    public String parseTrackingPlugin(boolean dev_enabled) {
        Log.d("iitcm", "enable tracking...");
        String js = "";
        // load plugin from external storage if dev mode are enabled
        if (dev_enabled)
            js = this.removePluginWrapper(iitc_path + "dev/user-location.user.js", false);
        else
            // load plugin from asset folder
            js = this.removePluginWrapper("user-location.user.js", true);
        return js;
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
            AssetManager am = context.getAssets();
            try {
                s = new Scanner(am.open(file)).useDelimiter("\\A");
            } catch (IOException e) {
                e.printStackTrace();
                Log.d("iitcm", "failed to parse file assets/" + file);
                return "false";
            }
        }

        if (s != null)
            src = s.hasNext() ? s.next() : "";
        return src;
    }

    // read a file into a string
    // load it as javascript
    // at the moment not needed, but not bad to have it in the IITC_WebViewClient API
    public boolean loadJS(String file, boolean asset, WebView view) {
        if (!file.endsWith("user.js"))
            return false;
        String js = fileToString(file, asset);
        if (js.equals("false"))
            return false;
        else
            view.loadUrl("javascript:" + js);
        return true;
    }

    // iitc and all plugins are loaded at the same time
    // so remove the wrapper functions and injection code
    // TODO: it only works if the plugin is coded with the iitc plugin template
    public String removePluginWrapper(String file, boolean asset) {
        if (!file.endsWith("user.js")) return "";
        String js = fileToString(file, asset);
        if (js.equals("false")) return "";
        js = js.replaceAll("\r\n", "\n");  //convert CR-LF pairs to LF - windows format text files
        js = js.replaceAll("\r", "\n");    //convert remaining CR to LF - Mac format files(?)
        String wrapper_start = "function wrapper() {";
        String wrapper_end = "} // wrapper end";
        String injection_code = "// inject code into site context\n" +
                "var script = document.createElement('script');\n" +
                "script.appendChild(document.createTextNode('('+ wrapper +')();'));\n" +
                "(document.body || document.head || document.documentElement).appendChild(script);";
        if (js.contains(wrapper_start) && js.contains(wrapper_end) && js.contains(injection_code)) {
            js = js.replace(wrapper_start, "");
            // remove the wrapper function
            js = js.replace(wrapper_end, "");
            // and the code injection
            js = js.replace(injection_code, "");
        } else {
            Log.d("iitcm", "Removal of wrapper/injection code failed for " + file);
            return "";
        }
        return js;
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
            return new WebResourceResponse("text/css", "UTF-8", style);
        } else if (url.contains("gen_dashboard.js")) {
            Log.d("iitcm", "replacing gen_dashboard.js with iitc script");
            Log.d("iitcm", "injecting iitc...");
            return this.iitcjs;
        } else if (url.contains("/css/ap_icons.css")
                || url.contains("/css/map_icons.css")
                || url.contains("/css/misc_icons.css")
                || url.contains("/css/style_full.css")
                || url.contains("/css/style_mobile.css")
                || url.contains("/css/portalrender.css")
                || url.contains("js/analytics.js")
                || url.contains("google-analytics.com/ga.js")) {
            return new WebResourceResponse("text/plain", "UTF-8", empty);
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
                ((IITC_Mobile) context).loadUrl(url);
            }
            return false;
        } else {
            Log.d("iitcm",
                    "no ingress intel link, start external app to load url: "
                            + url);
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            context.startActivity(intent);
            return true;
        }
    }
}
