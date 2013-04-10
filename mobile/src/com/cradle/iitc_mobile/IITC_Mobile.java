package com.cradle.iitc_mobile;

import java.io.IOException;

import com.cradle.iitc_mobile.R;

import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Configuration;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

    private IITC_WebView iitc_view;
    private boolean back_button_pressed = false;
    private boolean desktop = false;
    private OnSharedPreferenceChangeListener listener;
    private String intel_url = "https://www.ingress.com/intel";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // TODO build an async task for url.openStream() in IITC_WebViewClient
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        setContentView(R.layout.activity_main);
        iitc_view = (IITC_WebView) findViewById(R.id.iitc_webview);

        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
        listener = new OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
                if (key.equals("pref_force_desktop"))
                    desktop = sharedPreferences.getBoolean("pref_force_desktop", false);
                IITC_Mobile.this.loadUrl(intel_url);
            }
        };
        sharedPref.registerOnSharedPreferenceChangeListener(listener);

        // load new iitc web view with ingress intel page
        Intent intent = getIntent();
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            Uri uri = intent.getData();
            String url = uri.toString();
            if (intent.getScheme().equals("http://"))
                url = url.replace("http://", "https://");
            Log.d("iitcm", "intent received url: " + url);
            if (url.contains("ingress.com")) {
                Log.d("iitcm", "loading url...");
                this.loadUrl(url);
            }
        }
        else {
            Log.d("iitcm", "no intent...loading " + intel_url);
            this.loadUrl(intel_url);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        // enough idle...let's do some work
        Log.d("iitcm", "resuming...setting reset idleTimer");
        iitc_view.loadUrl("javascript: window.idleTime = 0");
        iitc_view.loadUrl("javascript: window.renderUpdateStatus()");
    }

    @Override
    protected void onStop() {
        ConnectivityManager conMan = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkInfo mobile = conMan.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        NetworkInfo wifi = conMan.getNetworkInfo(ConnectivityManager.TYPE_WIFI);

        // check if Mobile or Wifi module is available..then handle states
        // TODO: theory...we do not have to check for a Wifi module...every android device should have one
        if (mobile != null) {
            Log.d("iitcm", "mobile internet module detected...check states");
            if (mobile.getState() == NetworkInfo.State.CONNECTED || mobile.getState() == NetworkInfo.State.CONNECTING) {
                Log.d("iitcm", "connected to mobile net...abort all running requests");
                // cancel all current requests
                iitc_view.loadUrl("javascript: window.requests.abort()");
                // set idletime to maximum...no need for more
                iitc_view.loadUrl("javascript: window.idleTime = 999");
            } else if (wifi.getState() == NetworkInfo.State.CONNECTED || wifi.getState() == NetworkInfo.State.CONNECTING) {
                    iitc_view.loadUrl("javascript: window.idleTime = 999");
            }
        } else {
            Log.d("iitcm", "no mobile internet module detected...check wifi state");
            if (wifi.getState() == NetworkInfo.State.CONNECTED || wifi.getState() == NetworkInfo.State.CONNECTING) {
                iitc_view.loadUrl("javascript: window.idleTime = 999");
            }
        }
        Log.d("iitcm", "stopping iitcm");
        super.onStop();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        Log.d("iitcm", "configuration changed...restoring...reset idleTimer");
        iitc_view.loadUrl("javascript: window.idleTime = 0");
        iitc_view.loadUrl("javascript: window.renderUpdateStatus()");
    }

    // we want a self defined behavior for the back button
    @Override
    public void onBackPressed() {
        if (this.back_button_pressed) {
            super.onBackPressed();
            return;
        }

        iitc_view.loadUrl("javascript: window.goBack();");
        this.back_button_pressed = true;
        Toast.makeText(this, "Press twice to exit", Toast.LENGTH_SHORT).show();

        // reset back button after 0.5 seconds
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                back_button_pressed=false;
            }
        }, 500);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle item selection
        switch (item.getItemId()) {
        case R.id.reload_button:
            this.loadUrl(intel_url);
            return true;
        // clear cache
        case R.id.cache_clear:
            iitc_view.clearHistory();
            iitc_view.clearFormData();
            iitc_view.clearCache(true);
            return true;
        // get the users current location and focus it on map
        case R.id.locate:
            iitc_view.loadUrl("javascript: window.map.locate({setView : true, maxZoom: 13});");
            return true;
        // start settings activity
        case R.id.settings:
            Intent intent = new Intent(this, IITC_Settings.class);
            intent.putExtra("iitc_version", iitc_view.getWebViewClient().getIITCVersion());
            startActivity(intent);
            return true;
        default:
            return super.onOptionsItemSelected(item);
        }
    }

    private void injectJS() {
        try {
            iitc_view.getWebViewClient().loadIITC_JS(this);
        } catch (IOException e1) {
            e1.printStackTrace();
        } catch (NullPointerException e2) {
            e2.printStackTrace();
        }
    }

    private String addUrlParam(String url) {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
        this.desktop = sharedPref.getBoolean("pref_force_desktop", false);

        if (desktop)
            return (url + "?vp=f");
        else
            return (url + "?vp=m");
    }

    public void loadUrl(String url) {
        url = addUrlParam(url);
        Log.d("iitcm", "injecting js...");
        injectJS();
        Log.d("iitcm", "loading url: " + url);
        iitc_view.loadUrl(url);
    }
}
