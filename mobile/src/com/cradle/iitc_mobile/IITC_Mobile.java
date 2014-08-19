package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.app.SearchManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.NfcEvent;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemLongClickListener;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ListView;
import android.widget.PopupMenu;
import android.widget.SearchView;
import android.widget.TextView;
import android.widget.Toast;

import com.cradle.iitc_mobile.IITC_NavigationHelper.Pane;
import com.cradle.iitc_mobile.prefs.PluginPreferenceActivity;
import com.cradle.iitc_mobile.prefs.PreferenceActivity;
import com.cradle.iitc_mobile.share.ShareActivity;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.Stack;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class IITC_Mobile extends Activity
        implements OnSharedPreferenceChangeListener, NfcAdapter.CreateNdefMessageCallback, OnItemLongClickListener {
    private static final String mIntelUrl = "https://www.ingress.com/intel";

    private SharedPreferences mSharedPrefs;
    private IITC_FileManager mFileManager;
    private IITC_WebView mIitcWebView;
    private IITC_UserLocation mUserLocation;
    private IITC_NavigationHelper mNavigationHelper;
    private IITC_MapSettings mMapSettings;
    private IITC_DeviceAccountLogin mLogin;
    private final Vector<ResponseHandler> mResponseHandlers = new Vector<ResponseHandler>();
    private boolean mDesktopMode = false;
    private Set<String> mAdvancedMenu;
    private MenuItem mSearchMenuItem;
    private View mImageLoading;
    private ListView mLvDebug;
    private View mViewDebug;
    private ImageButton mBtnToggleMap;
    private EditText mEditCommand;
    private boolean mDebugging = false;
    private boolean mReloadNeeded = false;
    private boolean mIsLoading = true;
    private boolean mShowMapInDebug = false;
    private boolean mPersistentZoom = false;
    private final Stack<String> mDialogStack = new Stack<String>();
    private String mPermalink = null;
    private String mSearchTerm = null;

    // Used for custom back stack handling
    private final Stack<Pane> mBackStack = new Stack<IITC_NavigationHelper.Pane>();
    private Pane mCurrentPane = Pane.MAP;
    private boolean mBackButtonPressed = false;

    private final BroadcastReceiver mBroadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(final Context context, final Intent intent) {
            ((IITC_Mobile) context).installIitcUpdate();
        }
    };

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // enable progress bar above action bar
        requestWindowFeature(Window.FEATURE_PROGRESS);

        setContentView(R.layout.activity_main);
        mImageLoading = findViewById(R.id.imageLoading);
        mIitcWebView = (IITC_WebView) findViewById(R.id.iitc_webview);
        mLvDebug = (ListView) findViewById(R.id.lvDebug);
        mViewDebug = findViewById(R.id.viewDebug);
        mBtnToggleMap = (ImageButton) findViewById(R.id.btnToggleMapVisibility);
        mEditCommand = (EditText) findViewById(R.id.editCommand);
        mEditCommand.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(final TextView v, final int actionId, final KeyEvent event) {
                if (EditorInfo.IME_ACTION_GO == actionId ||
                        EditorInfo.IME_ACTION_SEND == actionId ||
                        EditorInfo.IME_ACTION_DONE == actionId) {
                    onBtnRunCodeClick(v);

                    final InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    imm.hideSoftInputFromWindow(v.getWindowToken(), 0);

                    return true;
                }
                return false;
            }
        });

        mLvDebug.setAdapter(new IITC_LogAdapter(this));
        mLvDebug.setOnItemLongClickListener(this);

        // do something if user changed something in the settings
        mSharedPrefs = PreferenceManager.getDefaultSharedPreferences(this);
        mSharedPrefs.registerOnSharedPreferenceChangeListener(this);

        // enable/disable mDesktopMode mode on menu create and url load
        mDesktopMode = mSharedPrefs.getBoolean("pref_force_desktop", false);

        // enable/disable advance menu
        final String[] menuDefaults = getResources().getStringArray(R.array.pref_android_menu_default);
        mAdvancedMenu = mSharedPrefs
                .getStringSet("pref_android_menu", new HashSet<String>(Arrays.asList(menuDefaults)));

        mPersistentZoom = mSharedPrefs.getBoolean("pref_persistent_zoom", false);

        // get fullscreen status from settings
        mIitcWebView.updateFullscreenStatus();

        mFileManager = new IITC_FileManager(this);
        mFileManager.setUpdateInterval(Integer.parseInt(mSharedPrefs.getString("pref_update_plugins_interval", "7")));

        mUserLocation = new IITC_UserLocation(this);
        mUserLocation.setLocationMode(Integer.parseInt(mSharedPrefs.getString("pref_user_location_mode", "0")));

        // pass ActionBar to helper because we deprecated getActionBar
        mNavigationHelper = new IITC_NavigationHelper(this, super.getActionBar());

        mMapSettings = new IITC_MapSettings(this);

        // Clear the back stack
        mBackStack.clear();

        // receive downloadManagers downloadComplete intent
        // afterwards install iitc update
        registerReceiver(mBroadcastReceiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        final NfcAdapter nfc = NfcAdapter.getDefaultAdapter(this);
        if (nfc != null) nfc.setNdefPushMessageCallback(this, this);

        handleIntent(getIntent(), true);
    }

    @Override
    public void onSharedPreferenceChanged(final SharedPreferences sharedPreferences, final String key) {
        if (key.equals("pref_force_desktop")) {
            mDesktopMode = sharedPreferences.getBoolean("pref_force_desktop", false);
            mNavigationHelper.onPrefChanged();
        } else if (key.equals("pref_user_location_mode")) {
            final int mode = Integer.parseInt(mSharedPrefs.getString("pref_user_location_mode", "0"));
            if (mUserLocation.setLocationMode(mode))
                mReloadNeeded = true;
            return;
        } else if (key.equals("pref_persistent_zoom")) {
            mPersistentZoom = mSharedPrefs.getBoolean("pref_persistent_zoom", false);
            return;
        } else if (key.equals("pref_fullscreen")) {
            mIitcWebView.updateFullscreenStatus();
            mNavigationHelper.onPrefChanged();
            return;
        } else if (key.equals("pref_android_menu")) {
            final String[] menuDefaults = getResources().getStringArray(R.array.pref_android_menu_default);
            mAdvancedMenu = mSharedPrefs.getStringSet("pref_android_menu",
                    new HashSet<String>(Arrays.asList(menuDefaults)));
            mNavigationHelper.setDebugMode(mAdvancedMenu.contains(R.string.menu_debug));
            invalidateOptionsMenu();
            // no reload needed
            return;
        } else if (key.equals("pref_fake_user_agent")) {
            mIitcWebView.setUserAgent();
        } else if (key.equals("pref_last_plugin_update")) {
            final Long forceUpdate = sharedPreferences.getLong("pref_last_plugin_update", 0);
            if (forceUpdate == 0) mFileManager.updatePlugins(true);
            return;
        } else if (key.equals("pref_update_plugins_interval")) {
            final int interval = Integer.parseInt(mSharedPrefs.getString("pref_update_plugins_interval", "7"));
            mFileManager.setUpdateInterval(interval);
            return;
        } else if (key.equals("pref_press_twice_to_exit")
                || key.equals("pref_share_selected_tab")
                || key.equals("pref_messages")
                || key.equals("pref_secure_updates")
                || key.equals("pref_external_storage")) {
            // no reload needed
            return;
        }

        mReloadNeeded = true;
    }

    @Override
    protected void onNewIntent(final Intent intent) {
        setIntent(intent);
        handleIntent(intent, false);
    }

    // handles ingress intel url intents, search intents, geo intents and javascript file intents
    private void handleIntent(final Intent intent, final boolean onCreate) {
        final String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)) {
            final Uri uri = intent.getData();
            Log.d("intent received url: " + uri.toString());

            if (uri.getScheme().equals("http") || uri.getScheme().equals("https")) {
                if (uri.getHost() != null
                        && (uri.getHost().equals("ingress.com") || uri.getHost().endsWith(".ingress.com"))) {
                    Log.d("loading url...");
                    loadUrl(uri.toString());
                    return;
                }
            }

            if (uri.getScheme().equals("geo")) {
                try {
                    handleGeoUri(uri);
                    return;
                } catch (final URISyntaxException e) {
                    Log.w(e);
                    new AlertDialog.Builder(this)
                            .setTitle(R.string.intent_error)
                            .setMessage(e.getReason())
                            .setNeutralButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(final DialogInterface dialog, final int which) {
                                    dialog.dismiss();
                                }
                            })
                            .create()
                            .show();
                }
            }

            // intent MIME type and uri path may be null
            final String type = intent.getType() == null ? "" : intent.getType();
            final String path = uri.getPath() == null ? "" : uri.getPath();
            if (path.endsWith(".user.js") || type.contains("javascript")) {
                final Intent prefIntent = new Intent(this, PluginPreferenceActivity.class);
                prefIntent.setDataAndType(uri, intent.getType());
                startActivity(prefIntent);
            }
        }

        if (Intent.ACTION_SEARCH.equals(action)) {
            String query = intent.getStringExtra(SearchManager.QUERY);
            query = query.replace("'", "''");
            final SearchView searchView =
                    (SearchView) mSearchMenuItem.getActionView();
            searchView.setQuery(query, false);
            searchView.clearFocus();

            switchToPane(Pane.MAP);
            mIitcWebView.loadUrl("javascript:search('" + query + "');");
            return;
        }

        if (onCreate) {
            loadUrl(mIntelUrl);
        }
    }

    private void handleGeoUri(final Uri uri) throws URISyntaxException {
        final String[] parts = uri.getSchemeSpecificPart().split("\\?", 2);
        Double lat = null, lon = null;
        Integer z = null;
        String search = null;

        // parts[0] may contain an 'uncertainty' parameter, delimited by a semicolon
        final String[] pos = parts[0].split(";", 2)[0].split(",", 2);
        if (pos.length == 2) {
            try {
                lat = Double.valueOf(pos[0]);
                lon = Double.valueOf(pos[1]);
            } catch (final NumberFormatException e) {
                lat = null;
                lon = null;
            }
        }

        if (parts.length > 1) { // query string present
            // search for z=
            for (final String param : parts[1].split("&")) {
                if (param.startsWith("z=")) {
                    try {
                        z = Integer.valueOf(param.substring(2));
                    } catch (final NumberFormatException e) {
                    }
                }
                if (param.startsWith("q=")) {
                    search = param.substring(2);
                    final Pattern pattern = Pattern.compile("^(-?\\d+(\\.\\d+)?),(-?\\d+(\\.\\d+)?)\\s*\\(.+\\)");
                    final Matcher matcher = pattern.matcher(search);
                    if (matcher.matches()) {
                        try {
                            lat = Double.valueOf(matcher.group(1));
                            lon = Double.valueOf(matcher.group(3));
                            search = null; // if we have a position, we don't need the search term
                        } catch (final NumberFormatException e) {
                            lat = null;
                            lon = null;
                        }
                    }
                }
            }
        }

        if (lat != null && lon != null) {
            String url = mIntelUrl + "?ll=" + lat + "," + lon;
            if (z != null) {
                url += "&z=" + z;
            }
            loadUrl(url);
            return;
        }

        if (search != null) {
            if (mIsLoading) {
                mSearchTerm = search;
                loadUrl(mIntelUrl);
            } else {
                switchToPane(Pane.MAP);
                mIitcWebView.loadUrl("javascript:search('" + search + "');");
            }
            return;
        }

        throw new URISyntaxException(uri.toString(), "position could not be parsed");
    }

    @Override
    protected void onStart() {
        super.onStart();

        if (mReloadNeeded) {
            Log.d("preference had changed...reload needed");
            reloadIITC();
        } else {
            // iitc is not fully booted...timer will be reset by the script itself
            if (findViewById(R.id.imageLoading).getVisibility() == View.GONE) {
                // enough idle...let's do some work
                Log.d("resuming...reset idleTimer");
                mIitcWebView.loadJS("(function(){if(window.idleReset) window.idleReset();})();");
            }
        }

        mUserLocation.onStart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mIitcWebView.resumeTimers();
        mIitcWebView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        mIitcWebView.pauseTimers();
        mIitcWebView.onPause();
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d("stopping iitcm");
        mIitcWebView.loadUrl("javascript: window.idleSet();");
        mUserLocation.onStop();
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(mBroadcastReceiver);
        super.onDestroy();
    }

    @Override
    public void onConfigurationChanged(final Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        mNavigationHelper.onConfigurationChanged(newConfig);

        Log.d("configuration changed...restoring...reset idleTimer");
        mIitcWebView.loadUrl("javascript: window.idleTime = 0");
        mIitcWebView.loadUrl("javascript: window.renderUpdateStatus()");
    }

    @Override
    protected void onPostCreate(final Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        mNavigationHelper.onPostCreate(savedInstanceState);
    }

    // we want a self defined behavior for the back button
    @Override
    public void onBackPressed() {
        // exit fullscreen mode if it is enabled and action bar is disabled or the back stack is empty
        if (mIitcWebView.isInFullscreen() && mBackStack.isEmpty()) {
            mIitcWebView.toggleFullscreen();
            return;
        }

        // close drawer if opened
        if (mNavigationHelper.isDrawerOpened()) {
            mNavigationHelper.closeDrawers();
            return;
        }

        // kill all open iitc dialogs
        if (!mDialogStack.isEmpty()) {
            final String id = mDialogStack.pop();
            mIitcWebView.loadUrl("javascript: " +
                    "var selector = $(window.DIALOGS['" + id + "']); " +
                    "selector.dialog('close'); " +
                    "selector.remove();");
            return;
        }

        // Pop last item from backstack and pretend the relevant menu item was clicked
        if (!mBackStack.isEmpty()) {
            backStackPop();
            mBackButtonPressed = true;
            return;
        }

        if (mBackButtonPressed || !mSharedPrefs.getBoolean("pref_press_twice_to_exit", false)) {
            super.onBackPressed();
        } else {
            mBackButtonPressed = true;
            Toast.makeText(this, "Press twice to exit", Toast.LENGTH_SHORT).show();
            // reset back button after 2 seconds
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    mBackButtonPressed = false;
                }
            }, 2000);
        }
    }

    public void backStackPop() {
        // shouldn't be called when back stack is empty
        // catch wrong usage
        if (mBackStack.isEmpty()) {
            mBackStack.push(Pane.MAP);
        }

        final Pane pane = mBackStack.pop();
        switchToPane(pane);
    }

    public void setCurrentPane(final Pane pane) {
        // ensure no double adds
        if (pane == mCurrentPane) return;

        // map pane is top-lvl. clear stack.
        if (pane == Pane.MAP) {
            mBackStack.clear();
        }
        // don't push current pane to backstack if this method was called via back button
        else if (!mBackButtonPressed) mBackStack.push(mCurrentPane);

        mBackButtonPressed = false;
        mCurrentPane = pane;
        mNavigationHelper.switchTo(pane);
    }

    public void switchToPane(final Pane pane) {
        if (mDesktopMode) return;
        mIitcWebView.loadUrl("javascript: window.show('" + pane.name + "');");
    }

    @Override
    public boolean onCreateOptionsMenu(final Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        // Get the SearchView and set the searchable configuration
        final SearchManager searchManager = (SearchManager) getSystemService(Context.SEARCH_SERVICE);
        mSearchMenuItem = menu.findItem(R.id.menu_search);
        final SearchView searchView = (SearchView) mSearchMenuItem.getActionView();
        // Assumes current activity is the searchable activity
        searchView.setSearchableInfo(searchManager.getSearchableInfo(getComponentName()));
        searchView.setIconifiedByDefault(false); // Do not iconify the widget; expand it by default
        return true;
    }

    @Override
    public boolean onPrepareOptionsMenu(final Menu menu) {
        boolean visible = false;
        if (mNavigationHelper != null) visible = !mNavigationHelper.isDrawerOpened();
        if (mIsLoading) visible = false;

        for (int i = 0; i < menu.size(); i++) {
            final MenuItem item = menu.getItem(i);
            final boolean enabled = mAdvancedMenu.contains(item.getTitle());

            switch (item.getItemId()) {
                case R.id.action_settings:
                    item.setVisible(true);
                    break;

                case R.id.locate:
                    item.setVisible(enabled && visible);
                    item.setEnabled(!mIsLoading);
                    item.setIcon(mUserLocation.isFollowing()
                            ? R.drawable.ic_action_location_follow
                            : R.drawable.ic_action_location_found);
                    break;

                case R.id.menu_debug:
                    item.setVisible(enabled);
                    item.setChecked(mDebugging);
                    break;

                default:
                    item.setVisible(enabled && visible);
            }
        }

        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(final MenuItem item) {
        if (mNavigationHelper.onOptionsItemSelected(item)) return true;

        // Handle item selection
        final int itemId = item.getItemId();

        switch (itemId) {
            case android.R.id.home:
                switchToPane(Pane.MAP);
                return true;
            case R.id.reload_button:
                reloadIITC();
                return true;
            case R.id.toggle_fullscreen:
                mIitcWebView.toggleFullscreen();
                return true;
            case R.id.layer_chooser:
                mNavigationHelper.openRightDrawer();
                return true;
            case R.id.locate: // get the users current location and focus it on map
                switchToPane(Pane.MAP);

                if (mUserLocation.hasCurrentLocation()) {
                    // if gps location is displayed we can use a better location without any costs
                    mUserLocation.locate(mPersistentZoom);
                } else {
                    // get location from network by default
                    mIitcWebView.loadUrl("javascript: window.map.locate({setView : true" +
                            (mPersistentZoom ? ", maxZoom : map.getZoom()" : "") + "});");
                }
                return true;
            case R.id.action_settings: // start settings activity
                final Intent intent = new Intent(this, PreferenceActivity.class);
                try {
                    intent.putExtra("iitc_version", mFileManager.getIITCVersion());
                } catch (final IOException e) {
                    Log.w(e);
                    return true;
                }
                startActivity(intent);
                return true;
            case R.id.menu_clear_cookies:
                final CookieManager cm = CookieManager.getInstance();
                cm.removeAllCookie();
                return true;
            case R.id.menu_send_screenshot:
                sendScreenshot();
                return true;
            case R.id.menu_debug:
                mDebugging = !mDebugging;
                updateViews();
                invalidateOptionsMenu();

                // TODO remove debugging stuff from JS?
                return true;
            default:
                return false;
        }
    }

    @Override
    public File getCacheDir() {
        return getApplicationContext().getCacheDir();
    }

    public void reloadIITC() {
        loadUrl(mIntelUrl);
        mReloadNeeded = false;
    }

    // vp=f enables mDesktopMode mode...vp=m is the default mobile view
    private String addUrlParam(final String url) {
        return url + (url.contains("?") ? '&' : '?') + "vp=" + (mDesktopMode ? 'f' : 'm');
    }

    public void reset() {
        mNavigationHelper.reset();
        mMapSettings.reset();
        mUserLocation.reset();
        mIitcWebView.getWebViewClient().reset();
        mBackStack.clear();
        mCurrentPane = Pane.MAP;
    }

    // inject the iitc-script and load the intel url
    // plugins are injected onPageFinished
    public void loadUrl(String url) {
        reset();
        setLoadingState(true);
        url = addUrlParam(url);
        mIitcWebView.loadUrl(url);
    }

    public IITC_WebView getWebView() {
        return mIitcWebView;
    }

    public void startActivityForResult(final Intent launch, final ResponseHandler handler) {
        int index = mResponseHandlers.indexOf(handler);
        if (index == -1) {
            mResponseHandlers.add(handler);
            index = mResponseHandlers.indexOf(handler);
        }

        startActivityForResult(launch, RESULT_FIRST_USER + index);
    }

    public void deleteResponseHandler(final ResponseHandler handler) {
        final int index = mResponseHandlers.indexOf(handler);
        if (index != -1) {
            // set value to null to enable garbage collection, but don't remove it to keep indexes
            mResponseHandlers.set(index, null);
        }
    }

    @Override
    protected void onActivityResult(final int requestCode, final int resultCode, final Intent data) {
        final int index = requestCode - RESULT_FIRST_USER;

        try {
            final ResponseHandler handler = mResponseHandlers.get(index);
            handler.onActivityResult(resultCode, data);
        } catch (final ArrayIndexOutOfBoundsException e) {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * called by IITC_WebViewClient when the Google login form is opened.
     */
    public void onReceivedLoginRequest(final IITC_WebViewClient client, final WebView view, final String realm,
            final String account, final String args) {
        mLogin = new IITC_DeviceAccountLogin(this, view, client);
        mLogin.startLogin(realm, account, args);
    }

    /**
     * called after successful login
     */
    public void loginSucceeded() {
        // garbage collection
        mLogin = null;
        setLoadingState(true);
    }

    // remove dialog and add it back again
    // to ensure it is the last element of the list
    // focused dialogs should be closed first
    public void setFocusedDialog(final String id) {
        Log.d("Dialog " + id + " focused");
        mDialogStack.remove(id);
        mDialogStack.push(id);
    }

    // called by the javascript interface
    public void dialogOpened(final String id, final boolean open) {
        if (open) {
            Log.d("Dialog " + id + " added");
            mDialogStack.push(id);
        } else {
            Log.d("Dialog " + id + " closed");
            mDialogStack.remove(id);
        }
    }

    public void setLoadingState(final boolean isLoading) {
        mIsLoading = isLoading;
        mNavigationHelper.onLoadingStateChanged();
        invalidateOptionsMenu();
        updateViews();
        if (!isLoading) mFileManager.updatePlugins(false);

        if (mSearchTerm != null && !isLoading) {
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    // switchToPane(Pane.MAP);
                    mIitcWebView.loadUrl("javascript:search('" + mSearchTerm + "');");
                    mSearchTerm = null;
                }
            }, 5000);
        }
    }

    private void updateViews() {
        if (!mDebugging) {
            mViewDebug.setVisibility(View.GONE);
            mLvDebug.setVisibility(View.GONE);

            if (mIsLoading && !mSharedPrefs.getBoolean("pref_disable_splash", false)) {
                mIitcWebView.setVisibility(View.GONE);
                mImageLoading.setVisibility(View.VISIBLE);
            } else {
                mIitcWebView.setVisibility(View.VISIBLE);
                mImageLoading.setVisibility(View.GONE);
            }
        } else {
            // if the debug container is invisible (and we are about to show it), select the text box
            final boolean select = mViewDebug.getVisibility() != View.VISIBLE;

            mImageLoading.setVisibility(View.GONE); // never show splash screen while debugging
            mViewDebug.setVisibility(View.VISIBLE);

            if (select) {
                mEditCommand.requestFocus();
                mEditCommand.selectAll();
            }

            if (mShowMapInDebug) {
                mBtnToggleMap.setImageResource(R.drawable.ic_action_view_as_list);
                mIitcWebView.setVisibility(View.VISIBLE);
                mLvDebug.setVisibility(View.GONE);
            } else {
                mBtnToggleMap.setImageResource(R.drawable.ic_action_map);
                mIitcWebView.setVisibility(View.GONE);
                mLvDebug.setVisibility(View.VISIBLE);
            }
        }
    }

    public void onBtnRunCodeClick(final View v) {
        final String code = mEditCommand.getText().toString();
        final JSONObject obj = new JSONObject();
        try {
            obj.put("code", code);
        } catch (final JSONException e) {
            Log.w(e);
            return;
        }

        // throwing an exception will be reported by WebView
        final String js = "(function(obj){var result;" +
                "console.log('>>> ' + obj.code);" +
                "try{result=eval(obj.code);}catch(e){if(e.stack) console.error(e.stack);throw e;}" +
                "if(result!==undefined) console.log(result.toString());" +
                "})(" + obj.toString() + ");";

        mIitcWebView.loadJS(js);
    }

    /**
     * onClick handler for R.id.btnToggleMapVisibility, assigned in activity_main.xml
     */
    public void onToggleMapVisibility(final View v)
    {
        mShowMapInDebug = !mShowMapInDebug;
        updateViews();
    }

    /**
     * onClick handler for R.id.btnClearLog, assigned in activity_main.xml
     */
    public void onClearLog(final View v)
    {
        ((IITC_LogAdapter) mLvDebug.getAdapter()).clear();
    }

    private void deleteUpdateFile() {
        final File file = new File(getExternalFilesDir(null).toString() + "/iitcUpdate.apk");
        if (file != null) file.delete();
    }

    public void updateIitc(final String url) {
        final DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setDescription(getString(R.string.download_description));
        request.setTitle("IITCm Update");
        request.allowScanningByMediaScanner();
        final Uri fileUri = Uri.parse("file://" + getExternalFilesDir(null).toString() + "/iitcUpdate.apk");
        request.setDestinationUri(fileUri);
        // remove old update file...we don't want to spam the external storage
        deleteUpdateFile();
        // get download service and enqueue file
        final DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        manager.enqueue(request);
    }

    private void installIitcUpdate() {
        final String iitcUpdatePath = getExternalFilesDir(null).toString() + "/iitcUpdate.apk";
        final Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.fromFile(new File(iitcUpdatePath)), "application/vnd.android.package-archive");
        startActivity(intent);
        // finish app, because otherwise it gets killed on update
        finish();
    }

    public boolean isLoading() {
        return mIsLoading;
    }

    /**
     * @see getNavigationHelper()
     * @deprecated ActionBar related stuff should be handled by IITC_NavigationHelper
     */
    @Deprecated
    @Override
    public ActionBar getActionBar() {
        return super.getActionBar();
    }

    public IITC_NavigationHelper getNavigationHelper() {
        return mNavigationHelper;
    }

    public IITC_MapSettings getMapSettings() {
        return mMapSettings;
    }

    public IITC_FileManager getFileManager() {
        return mFileManager;
    }

    public SharedPreferences getPrefs() {
        return mSharedPrefs;
    }

    public IITC_UserLocation getUserLocation() {
        return mUserLocation;
    }

    public interface ResponseHandler {
        void onActivityResult(int resultCode, Intent data);
    }

    public void setPermalink(final String href) {
        mPermalink = href;
    }

    private void sendScreenshot() {
        Bitmap bitmap = mIitcWebView.getDrawingCache();
        if (bitmap == null) {
            mIitcWebView.buildDrawingCache();
            bitmap = mIitcWebView.getDrawingCache();
            if (bitmap == null) {
                Log.e("could not get bitmap!");
                return;
            }
            bitmap = Bitmap.createBitmap(bitmap);
            if (!mIitcWebView.isDrawingCacheEnabled()) mIitcWebView.destroyDrawingCache();
        }
        else {
            bitmap = Bitmap.createBitmap(bitmap);
        }

        try {
            final File cache = getExternalCacheDir();
            final File file = File.createTempFile("IITC screenshot", ".png", cache);
            if (!bitmap.compress(CompressFormat.PNG, 100, new FileOutputStream(file))) {
                // quality is ignored by PNG
                throw new IOException("Could not compress bitmap!");
            }
            startActivityForResult(ShareActivity.forFile(this, file, "image/png"), new ResponseHandler() {
                @Override
                public void onActivityResult(final int resultCode, final Intent data) {
                    file.delete();
                }
            });
        } catch (final IOException e) {
            Log.e("Could not generate screenshot", e);
        }
    }

    @Override
    public NdefMessage createNdefMessage(final NfcEvent event) {
        NdefRecord[] records;
        if (mPermalink == null) { // no permalink yet, just provide AAR
            records = new NdefRecord[] {
                    NdefRecord.createApplicationRecord(getPackageName())
            };
        } else {
            records = new NdefRecord[] {
                    NdefRecord.createUri(mPermalink),
                    NdefRecord.createApplicationRecord(getPackageName())
            };
        }
        return new NdefMessage(records);
    }

    @Override
    public boolean onItemLongClick(final AdapterView<?> parent, final View view, final int position, final long id) {
        if (parent == mLvDebug) {
            final IITC_LogAdapter adapter = ((IITC_LogAdapter) parent.getAdapter());
            final Log.Message item = adapter.getItem(position);

            final PopupMenu popupMenu = new PopupMenu(this, view);
            popupMenu.getMenuInflater().inflate(R.menu.debug, popupMenu.getMenu());

            popupMenu.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener() {
                @Override
                public boolean onMenuItemClick(final MenuItem menuitem) {
                    switch (menuitem.getItemId()) {
                        case R.id.menu_copy:
                            mIitcWebView.getJSInterface().copy(item.toString());
                            return true;
                        case R.id.menu_delete:
                            adapter.remove(item);
                            return true;
                    }
                    return false;
                }
            });

            popupMenu.show();
        }
        return false;
    }
}
