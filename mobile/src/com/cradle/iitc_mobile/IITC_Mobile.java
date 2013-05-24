package com.cradle.iitc_mobile;

import java.io.IOException;

import android.app.ActionBar;
import android.app.Activity;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Configuration;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.widget.SearchView;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

    private static final int REQUEST_LOGIN = 1;

    private IITC_WebView iitc_view;
    private OnSharedPreferenceChangeListener listener;
    private String intel_url = "https://www.ingress.com/intel";
    private boolean user_loc = false;
    private LocationManager loc_mngr = null;
    private LocationListener loc_listener = null;
    private boolean fullscreen_mode = false;
    private boolean fullscreen_actionbar = false;
    private ActionBar actionBar;
    private IITC_DeviceAccountLogin mLogin;
    private MenuItem searchMenuItem;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // enable progress bar above action bar
        requestWindowFeature(Window.FEATURE_PROGRESS);

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
                    fullscreen_actionbar = sharedPreferences.getBoolean("pref_fullscreen_actionbar",
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

        handleIntent(getIntent(), true);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        setIntent(intent);
        handleIntent(intent, false);
    }

    private void handleIntent(Intent intent, boolean onCreate) {
        // load new iitc web view with ingress intel page
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
        } else if (Intent.ACTION_SEARCH.equals(action)) {
            String query = intent.getStringExtra(SearchManager.QUERY);
            query = query.replace("'", "''");
            final SearchView searchView =
                    (SearchView) searchMenuItem.getActionView();
            searchView.setQuery(query, false);
            searchView.clearFocus();
            iitc_view.loadUrl("javascript:search('" + query + "');");
        } else if (onCreate){
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
        iitc_view.loadUrl("javascript: window.goBack();");
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        // Get the SearchView and set the searchable configuration
        SearchManager searchManager = (SearchManager) getSystemService(Context.SEARCH_SERVICE);
        this.searchMenuItem = menu.findItem(R.id.menu_search);
        final SearchView searchView =
                (SearchView) searchMenuItem.getActionView();
        // Assumes current activity is the searchable activity
        searchView.setSearchableInfo(searchManager.getSearchableInfo(getComponentName()));
        searchView.setIconifiedByDefault(false); // Do not iconify the widget; expand it by default
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle item selection
        switch (item.getItemId()) {
            case android.R.id.home:
                iitc_view.loadUrl("javascript: window.show('map');");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            case R.id.menu_map:
                iitc_view.loadUrl("javascript: window.show('map');");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            case R.id.reload_button:
                this.loadUrl(intel_url);
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            case R.id.toggle_fullscreen:
                toggleFullscreen();
                return true;
            case R.id.layer_chooser:
                // the getLayers function calls the setLayers method of IITC_JSInterface
                iitc_view.loadUrl("javascript: window.layerChooser.getLayers()");
                return true;
            // get the users current location and focus it on map
            case R.id.locate:
                iitc_view.loadUrl("javascript: window.show('map');");
                iitc_view.loadUrl("javascript: window.map.locate({setView : true, maxZoom: 15});");
                actionBar.setTitle(getString(R.string.menu_map));
                return true;
            // start settings activity
            case R.id.action_settings:
                Intent intent = new Intent(this, IITC_Settings.class);
                intent.putExtra("iitc_version", iitc_view.getWebViewClient()
                        .getIITCVersion());
                startActivity(intent);
                return true;
            case R.id.menu_info:
                iitc_view.loadUrl("javascript: window.show('info');");
                actionBar.setTitle(getString(R.string.menu_info));
                return true;
            case R.id.menu_full:
                iitc_view.loadUrl("javascript: window.show('full');");
                actionBar.setTitle(getString(R.string.menu_full));
                return true;
            case R.id.menu_compact:
                iitc_view.loadUrl("javascript: window.show('compact');");
                actionBar.setTitle(getString(R.string.menu_compact));
                return true;
            case R.id.menu_public:
                iitc_view.loadUrl("javascript: window.show('public');");
                actionBar.setTitle(getString(R.string.menu_public));
                return true;
            case R.id.menu_faction:
                iitc_view.loadUrl("javascript: window.show('faction');");
                actionBar.setTitle(getString(R.string.menu_faction));
                return true;
            case R.id.menu_debug:
                iitc_view.loadUrl("javascript: window.show('debug')");
                actionBar.setTitle(getString(R.string.menu_debug));
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

    /**
     * It can occur that in order to authenticate, an external activity has to be launched. (This could for example be a
     * confirmation dialog.)
     */
    public void startLoginActivity(Intent launch) {
        startActivityForResult(launch, REQUEST_LOGIN); // REQUEST_LOGIN is to recognize the result
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        switch (requestCode) {
            case REQUEST_LOGIN:
                // authentication activity has returned. mLogin will continue authentication
                mLogin.onActivityResult(resultCode, data);
                break;

            default:
                super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * called by IITC_WebViewClient when the Google login form is opened.
     */
    public void onReceivedLoginRequest(IITC_WebViewClient client, WebView view,
                                       String realm, String account, String args) {
        mLogin = new IITC_DeviceAccountLogin(this, view, client);
        mLogin.startLogin(realm, account, args);
    }

    /**
     * called after successful login
     */
    public void loginSucceeded() {
        // garbage collection
        mLogin = null;
    }
}
