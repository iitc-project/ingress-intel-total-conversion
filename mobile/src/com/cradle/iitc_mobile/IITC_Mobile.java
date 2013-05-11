package com.cradle.iitc_mobile;

import java.io.IOException;

import com.cradle.iitc_mobile.R;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.app.ActionBar;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Configuration;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.WindowManager;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

    private IITC_WebView iitc_view;
    private boolean back_button_pressed = false;
    private OnSharedPreferenceChangeListener listener;
    private String intel_url = "https://www.ingress.com/intel";
    private boolean user_loc = false;
    private LocationManager loc_mngr = null;
    private LocationListener loc_listener = null;
    private boolean fullscreen_mode = false;
    private boolean fullscreen_actionbar = false;
    private ActionBar actionBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // TODO build an async task for url.openStream() in IITC_WebViewClient
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                .permitAll().build();
        StrictMode.setThreadPolicy(policy);
        setContentView(R.layout.activity_main);
        iitc_view = (IITC_WebView) findViewById(R.id.iitc_webview);

        // fetch actionbar, set display flags, title and enable home button
        actionBar = this.getActionBar();
        actionBar.setDisplayOptions(ActionBar.DISPLAY_SHOW_HOME
                | ActionBar.DISPLAY_USE_LOGO | ActionBar.DISPLAY_SHOW_TITLE);
        actionBar.setTitle(getString(R.string.menu_map));
        actionBar.setHomeButtonEnabled(true);

        // do something if user changed something in the settings
        SharedPreferences sharedPref = PreferenceManager
                .getDefaultSharedPreferences(this);
        listener = new OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(
                    SharedPreferences sharedPreferences, String key) {
                if (key.equals("pref_user_loc"))
                    user_loc = sharedPreferences.getBoolean("pref_user_loc",
                            false);
                if (key.equals("pref_fullscreen_actionbar")) {
                    fullscreen_actionbar =sharedPreferences.getBoolean("pref_fullscreen_actionbar",
                            false);
                    if (fullscreen_mode)
                        IITC_Mobile.this.getActionBar().hide();
                }
                IITC_Mobile.this.loadUrl(intel_url);
            }
        };
        sharedPref.registerOnSharedPreferenceChangeListener(listener);

        // Acquire a reference to the system Location Manager
        loc_mngr = (LocationManager) this
                .getSystemService(Context.LOCATION_SERVICE);

        // Define a listener that responds to location updates
        loc_listener = new LocationListener() {
            public void onLocationChanged(Location location) {
                // Called when a new location is found by the network location
                // provider.
                drawMarker(location);
            }

            public void onStatusChanged(String provider, int status,
                    Bundle extras) {
            }

            public void onProviderEnabled(String provider) {
            }

            public void onProviderDisabled(String provider) {
            }
        };

        user_loc = sharedPref.getBoolean("pref_user_loc", false);
        if (user_loc == true) {
            // Register the listener with the Location Manager to receive
            // location updates
            loc_mngr.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,
                    0, 0, loc_listener);
            loc_mngr.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0,
                    loc_listener);
        }

        fullscreen_actionbar = sharedPref.getBoolean("pref_fullscreen_actionbar", false);

        // load new iitc web view with ingress intel page
        Intent intent = getIntent();
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            Uri uri = intent.getData();
            String url = uri.toString();
            if (intent.getScheme().equals("http"))
                url = url.replace("http://", "https://");
            Log.d("iitcm", "intent received url: " + url);
            if (url.contains("ingress.com")) {
                Log.d("iitcm", "loading url...");
                this.loadUrl(url);
            }
        } else {
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
        iitc_view.updateCaching();

        if (user_loc == true) {
            // Register the listener with the Location Manager to receive
            // location updates
            loc_mngr.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,
                    0, 0, loc_listener);
            loc_mngr.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0,
                    loc_listener);
        }
    }

    @Override
    protected void onStop() {
        ConnectivityManager conMan = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkInfo mobile = conMan
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        NetworkInfo wifi = conMan.getNetworkInfo(ConnectivityManager.TYPE_WIFI);

        // check if Mobile or Wifi module is available..then handle states
        // TODO: theory...we do not have to check for a Wifi module...every
        // android device should have one
        if (mobile != null) {
            Log.d("iitcm", "mobile internet module detected...check states");
            if (mobile.getState() == NetworkInfo.State.CONNECTED
                    || mobile.getState() == NetworkInfo.State.CONNECTING) {
                Log.d("iitcm",
                        "connected to mobile net...abort all running requests");
                // cancel all current requests
                iitc_view.loadUrl("javascript: window.requests.abort()");
                // set idletime to maximum...no need for more
                iitc_view.loadUrl("javascript: window.idleTime = 999");
            } else if (wifi.getState() == NetworkInfo.State.CONNECTED
                    || wifi.getState() == NetworkInfo.State.CONNECTING) {
                iitc_view.loadUrl("javascript: window.idleTime = 999");
            }
        } else {
            Log.d("iitcm",
                    "no mobile internet module detected...check wifi state");
            if (wifi.getState() == NetworkInfo.State.CONNECTED
                    || wifi.getState() == NetworkInfo.State.CONNECTING) {
                iitc_view.loadUrl("javascript: window.idleTime = 999");
            }
        }
        Log.d("iitcm", "stopping iitcm");

        if (user_loc == true)
            loc_mngr.removeUpdates(loc_listener);

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
        // exit fullscreen mode if it is enabled
        if (fullscreen_mode) {
            this.toggleFullscreen();
            return;
        }
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
                back_button_pressed = false;
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
            case android.R.id.home :
                iitc_view.loadUrl("javascript: window.show('map');");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            case R.id.menu_map :
                iitc_view.loadUrl("javascript: window.show('map');");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            case R.id.reload_button :
                this.loadUrl(intel_url);
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
                // clear cache
            case R.id.cache_clear :
                iitc_view.clearHistory();
                iitc_view.clearFormData();
                iitc_view.clearCache(true);
                return true;
            case R.id.toggle_fullscreen :
                toggleFullscreen();
                return true;
                // get the users current location and focus it on map
            case R.id.locate :
                iitc_view.loadUrl("javascript: window.show('map');");
                iitc_view.loadUrl("javascript: window.map.locate({setView : true, maxZoom: 15});");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
                // start settings activity
            case R.id.action_settings :
                Intent intent = new Intent(this, IITC_Settings.class);
                intent.putExtra("iitc_version", iitc_view.getWebViewClient()
                        .getIITCVersion());
                startActivity(intent);
                return true;
            case R.id.menu_info :
                iitc_view.loadUrl("javascript: window.show('info');");
                actionBar.setTitle(getString(R.string.menu_info));
                return true;
            case R.id.menu_full :
                iitc_view.loadUrl("javascript: window.show('full');");
                actionBar.setTitle(getString(R.string.menu_full));
                return true;
            case R.id.menu_compact :
                iitc_view.loadUrl("javascript: window.show('compact');");
                actionBar.setTitle(getString(R.string.menu_compact));
                return true;
            case R.id.menu_public :
                iitc_view.loadUrl("javascript: window.show('public');");
                actionBar.setTitle(getString(R.string.menu_public));
                return true;
            case R.id.menu_faction :
                iitc_view.loadUrl("javascript: window.show('faction');");
                actionBar.setTitle(getString(R.string.menu_faction));
                return true;
            case R.id.menu_debug :
                iitc_view.loadUrl("javascript: window.show('debug')");
                actionBar.setTitle(getString(R.string.menu_debug));
                return true;
            default :
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

    // Force mobile view.
    // New actions are not compatible with desktop mode
    private String addUrlParam(String url) {
        return (url + "?vp=m");
    }

    // inject the iitc-script and load the intel url
    // plugins are injected onPageFinished
    public void loadUrl(String url) {
        url = addUrlParam(url);
        Log.d("iitcm", "injecting main-script...");
        injectJS();
        iitc_view.loadUrl(url);
    }

    // update the user location marker on the map
    public void drawMarker(Location loc) {
        // throw away all positions with accuracy > 100 meters
        // should avoid gps glitches
        if (loc.getAccuracy() < 100) {
            iitc_view.loadUrl("javascript: "
                    + "window.plugin.userLocation.updateLocation( "
                    + loc.getLatitude() + ", " + loc.getLongitude() + ");");
        }
    }

    public void toggleFullscreen() {
        if (fullscreen_mode) {
            if (fullscreen_actionbar)
                this.getActionBar().show();
            this.fullscreen_mode = false;
        } else {
            if (fullscreen_actionbar)
                this.getActionBar().hide();
            this.fullscreen_mode = true;
            // show a toast with instructions to exit the fc mode again
            Toast.makeText(this, "Press back button to exit fullscreen",
                    Toast.LENGTH_SHORT).show();
        }
        // toggle notification bar
        WindowManager.LayoutParams attrs = getWindow().getAttributes();
        attrs.flags ^= WindowManager.LayoutParams.FLAG_FULLSCREEN;
        this.getWindow().setAttributes(attrs);
    }

    public IITC_WebView getWebView() {
        return this.iitc_view;
    }
}
