package com.cradle.iitc_mobile;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
import java.io.InputStream;
import java.io.IOException;
import java.net.URL;
import java.util.Scanner;
import java.util.Set;

public class IITC_WebViewClient extends WebViewClient {
    private static final ByteArrayInputStream style = new ByteArrayInputStream(
        "body, #dashboard_container, #map_canvas { background: #000 !important; }".getBytes());
    private static final ByteArrayInputStream empty = new ByteArrayInputStream("".getBytes());

    private WebResourceResponse iitcjs;
    private String js = null;
    private String iitc_path = null;
    Context context;

    public IITC_WebViewClient(Context c) {
        this.context = c;
        this.iitc_path = Environment.getExternalStorageDirectory().getPath() + "/IITC_Mobile/";
        try {
            loadIITC_JS(c);
        } catch(IOException e) {
            e.printStackTrace();
        }
    }

    public String getIITCVersion() {
        String header = "";
        if (js != null)
            header = js.substring(js.indexOf("==UserScript=="), js.indexOf("==/UserScript=="));
        // remove new line comments
        header = header.replace("\n//", "");
        // get a list of key-value
        String[] attributes = header.split(" +");
        String iitc_version = "not found";
        for (int i = 0; i < attributes.length; i++) {
            // search for version and use the value
            if (attributes[i].equals("@version")) iitc_version = attributes[i+1];
        }
        return iitc_version;
    }

    public void loadIITC_JS(Context c) throws java.io.IOException {
        // You are able to load the script from external source
        // if a http address is given, use script from this address. else use the local script
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(c);
        String iitc_source = sharedPref.getString("pref_iitc_source", "local");
        String js = "";

        // if developer mode are enabled, load all iitc script from external storage
        if (sharedPref.getBoolean("pref_dev_checkbox", true)) {
            File js_file = new File(iitc_path + "/dev/total-conversion-build.user.js");
            if (!js_file.exists()) {
                Toast.makeText(context, "File " + iitc_path +
                        "/dev/total-conversion-build.user.js not found. " +
                        "Disable developer mode or add iitc files " +
                        "to the dev folder.", Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(context, "Developer mode enabled", Toast.LENGTH_SHORT).show();
            }
            Scanner s = null;
            s = new Scanner(js_file).useDelimiter("\\A");
            if (s != null) js = s.hasNext() ? s.next() : "";
        } else {
            // load iitc script from web or asset folder
            if (iitc_source.contains("http")) {
                URL url = new URL(iitc_source);
                js = new Scanner(url.openStream(), "UTF-8").useDelimiter("\\A").next();
            } else {
                InputStream input;
                input = c.getAssets().open("total-conversion-build.user.js");
                int size = input.available();
                byte[] buffer = new byte[size];
                input.read(buffer);
                input.close();
                js = new String(buffer);
            }
        }

        this.js = js;

        // need to wrap the mobile iitc.js version in a document ready. IITC
        // expects to be injected after the DOM has been loaded completely.
        // Since the mobile client injects IITC by replacing the gen_dashboard
        // file, IITC runs to early. The document.ready delays IITC long enough
        // so it boots correctly.
        js = "$(document).ready(function(){" + js + "});";

        iitcjs = new WebResourceResponse(
            "text/javascript",
            "UTF-8",
            new ByteArrayInputStream(js.getBytes())
        );
    };

    // enable https
    @Override
    public void onReceivedSslError (WebView view, SslErrorHandler handler, SslError error) {
        handler.proceed() ;
    };

    // plugins should be loaded after the main script is injected
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);

        // get the plugin preferences
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        Set<String> plugin_list = sharedPref.getStringSet("pref_plugins", null);
        boolean dev_enabled = sharedPref.getBoolean("pref_dev_checkbox", true);

        // iterate through all enabled plugins and load them
        if (plugin_list != null) {
            AssetManager am = context.getAssets();
            String[] plugin_array = plugin_list.toArray(new String[0]);

            for(int i = 0; i < plugin_list.size(); i++) {
                Log.d("iitcm", "adding plugin " + plugin_array[i]);
                Scanner s = null;
                String src = "";
                try {
                    // load plugins from external storage if dev mode are enabled
                    if (dev_enabled) {
                        File js_file = new File(iitc_path + "/dev/plugins/" + plugin_array[i]);
                        s = new Scanner(js_file).useDelimiter("\\A");
                    }
                    else
                        // load plugins from asset folder
                        s = new Scanner(am.open("plugins/" + plugin_array[i])).useDelimiter("\\A");
                } catch (IOException e2) {
                    e2.printStackTrace();
                }
                if (s != null) src = s.hasNext() ? s.next() : "";
                view.loadUrl("javascript:" + src);
            }
        }

        // inject the user location script if enabled in settings
        if (sharedPref.getBoolean("pref_user_loc", false))
            enableTracking(view, dev_enabled);

        // load additional plugins from <storage-path>/IITC-Mobile/plugins/
        File directory = new File(iitc_path + "plugins/");
        File[] files = directory.listFiles();
        if (files != null) {
            for (int i = 0; i < files.length; ++i) {
                try {
                    String src = "";
                    Scanner s = new Scanner(files[i]).useDelimiter("\\A");
                    if (s != null) src = s.hasNext() ? s.next() : "";
                    Log.d("iitcm", "Loading additional plugin " + iitc_path + files[i]);
                    view.loadUrl("javascript:" + src);
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public void enableTracking(WebView view, boolean dev_enabled) {
        Log.d("iitcm", "enable tracking...");
        AssetManager am = context.getAssets();
        Scanner s = null;
        String src = "";
        try {
            // load plugin from external storage if dev mode are enabled
            if (dev_enabled) {
                File js_file = new File(iitc_path + "/dev/user-location.user.js");
                s = new Scanner(js_file).useDelimiter("\\A");
            }
            else
                // load plugin from asset folder
                s = new Scanner(am.open("user-location.user.js")).useDelimiter("\\A");
        } catch (IOException e2) {
            e2.printStackTrace();
        }
        if (s != null) src = s.hasNext() ? s.next() : "";
        view.loadUrl("javascript:" + src);
    }

    // Check every external resource if it’s okay to load it and maybe replace it
    // with our own content. This is used to block loading Niantic resources
    // which aren’t required and to inject IITC early into the site.
    // via http://stackoverflow.com/a/8274881/1684530
    @Override
    public WebResourceResponse shouldInterceptRequest (final WebView view, String url) {
        if(url.contains("/css/common.css")) {
            return new WebResourceResponse("text/css", "UTF-8", style);
        } else if(url.contains("gen_dashboard.js")) {
            return this.iitcjs;
        } else if(url.contains("/css/ap_icons.css")
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
            if (url.contains("intel?ll=") || (url.contains("latE6") && url.contains("lngE6"))) {
                Log.d("iitcm", "should be an internal clicked position link...reload script for: " + url);
                ((IITC_Mobile) context).loadUrl(url);
            }
            return false;
        } else {
            Log.d("iitcm", "no ingress intel link, start external app to load url: " + url);
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            context.startActivity(intent);
            return true;
        }
    }
}
