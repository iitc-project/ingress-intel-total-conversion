package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.app.ActionBar.OnNavigationListener;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.widget.ArrayAdapter;
import android.widget.Toast;

public class IITC_ActionBarHelper implements OnNavigationListener {
    /*
     * Show/hide the up arrow on the left end
     * getActionBar().setDisplayHomeAsUpEnabled(enabled);
     *
     * Show/hide the activity icon/logo
     * getActionBar().setDisplayShowHomeEnabled(enabled);
     *
     * Show/hide the activity title
     * getActionBar().setDisplayShowTitleEnabled(enabled);
     *
     * Makes the icon/title clickable
     * getActionBar().setHomeButtonEnabled(enabled);
     */

    private class HighlighterAdapter extends ArrayAdapter<String> {
        public HighlighterAdapter() {
            super(mIitc, android.R.layout.simple_list_item_1);
            clear();
        }

        @Override
        public void add(String object) {
            super.remove(object); // to avoid duplicates
            super.add(object);
        }

        @Override
        public void clear() {
            super.clear();
            add("No Highlights");// Probably must be the same as window._no_highlighter
        }
    }

    private IITC_Mobile mIitc;
    private ActionBar mActionBar;
    private SharedPreferences mPrefs;
    private HighlighterAdapter mHighlighters;

    private String mActiveHighlighter = null;
    private boolean mDesktopMode = false;
    private boolean mFullscreen = false;
    private boolean mHideInFullscreen = false;
    private int mPane = android.R.id.home;

    public IITC_ActionBarHelper(IITC_Mobile activity, ActionBar bar) {
        mIitc = activity;
        mActionBar = bar;
        mPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
        mHighlighters = new HighlighterAdapter();

        mActionBar.setDisplayShowHomeEnabled(true); // show icon
        mActionBar.setListNavigationCallbacks(mHighlighters, this);

        onPrefChanged(); // also calls updateActionBar()
    }

    private void updateActionBar() {
        boolean showHighlighter = true;

        if (mDesktopMode) {
            mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
            mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            mActionBar.setTitle(mIitc.getString(R.string.app_name));
        } else {
            if (mPane != android.R.id.home) {
                mActionBar.setDisplayHomeAsUpEnabled(true); // Show "up" indicator
                mActionBar.setHomeButtonEnabled(true);// Make icon clickable
                showHighlighter = false;
            }
            else {
                mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
                mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            }
            mActionBar.setTitle(IITC_Mobile.PANE_TITLES.get(mPane, mIitc.getString(R.string.app_name)));
        }

        if (mHighlighters.getCount() < 2) // there should always be "No Highlights"
            showHighlighter = false;

        if (showHighlighter) {
            mActionBar.setDisplayShowTitleEnabled(false); // Hide title
            mActionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_LIST);
        } else {
            mActionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
            mActionBar.setDisplayShowTitleEnabled(true); // Show title
        }
        if (mFullscreen && mHideInFullscreen)
            mActionBar.hide();
        else
            mActionBar.show();
    }

    public void addPortalHighlighter(String name) {
        mHighlighters.add(name);

        if (name.equals(mActiveHighlighter))
            setActiveHighlighter(name);

        updateActionBar();
    }

    public boolean hideInFullscreen() {
        return mHideInFullscreen;
    }

    @Override
    public boolean onNavigationItemSelected(int position, long itemId) {
        String name = mHighlighters.getItem(position);
        mIitc.getWebView().loadUrl("javascript: window.changePortalHighlights('" + name + "')");
        return true;
    }

    public void onPrefChanged() {
        mDesktopMode = mPrefs.getBoolean("pref_force_desktop", false);
        mHideInFullscreen = mPrefs.getBoolean("pref_fullscreen_actionbar", false);
        updateActionBar();
    }

    public void reset() {
        mHighlighters.clear();
        mPane = android.R.id.home;
        updateActionBar();
    }

    public void setActiveHighlighter(String name) {
        int position = mHighlighters.getPosition(name);
        if (position >= 0)
            mActionBar.setSelectedNavigationItem(position);

        mActiveHighlighter = name;
    }

    public void setFullscreen(boolean fullscreen) {
        mFullscreen = fullscreen;
        if (mFullscreen && mHideInFullscreen) {
            // show a toast with instructions to exit the fullscreen mode again
            Toast.makeText(mIitc, "Press back button to exit fullscreen", Toast.LENGTH_SHORT).show();
        }

        updateActionBar();
    }

    public void switchTo(int button) {
        mPane = button;
        updateActionBar();
    }
}
