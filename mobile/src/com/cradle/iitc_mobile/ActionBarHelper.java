package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.widget.Toast;

public class ActionBarHelper {
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

    private ActionBar mActionBar;
    private IITC_Mobile mIitc;
    private SharedPreferences mPrefs;

    private boolean mDesktopMode = false;
    private boolean mFullscreen = false;
    private boolean mHideInFullscreen = false;
    private int mPane = android.R.id.home;

    public ActionBarHelper(IITC_Mobile activity, ActionBar bar) {
        mIitc = activity;
        mActionBar = bar;
        mPrefs = PreferenceManager.getDefaultSharedPreferences(activity);

        mActionBar.setDisplayShowHomeEnabled(true); // show icon

        onPrefChanged(); // also calls updateActionBar()
    }

    private void updateActionBar() {
        if (mDesktopMode) {
            mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
            mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            mActionBar.setTitle(mIitc.getString(R.string.app_name));
        } else {
            if (mPane != android.R.id.home)
            {
                mActionBar.setDisplayHomeAsUpEnabled(true); // Show "up" indicator
                mActionBar.setHomeButtonEnabled(true);// Make icon clickable
            }
            else
            {
                mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
                mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            }
            mActionBar.setTitle(IITC_Mobile.PANE_TITLES.get(mPane, mIitc.getString(R.string.app_name)));
        }

        if (mFullscreen && mHideInFullscreen)
            mActionBar.hide();
        else
            mActionBar.show();
    }

    @Deprecated
    public void goHome() {
        switchTo(android.R.id.home);
    }

    public boolean hideInFullscreen() {
        return mHideInFullscreen;
    }

    public void onPrefChanged() {
        mDesktopMode = mPrefs.getBoolean("pref_force_desktop", false);
        mHideInFullscreen = mPrefs.getBoolean("pref_fullscreen_actionbar", false);
        updateActionBar();
    }

    public void reset()
    {
        mPane = android.R.id.home;
        updateActionBar();
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
