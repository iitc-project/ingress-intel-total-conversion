package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.app.ActionBar.OnNavigationListener;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.ActionBarDrawerToggle;
import android.support.v4.widget.DrawerLayout;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Comparator;

public class IITC_NavigationHelper extends ActionBarDrawerToggle implements OnNavigationListener, OnItemClickListener {
    // Show/hide the up arrow on the very left
    // getActionBar().setDisplayHomeAsUpEnabled(enabled);

    // Show/hide the activity icon/logo
    // getActionBar().setDisplayShowHomeEnabled(enabled);

    // Show/hide the activity title
    // getActionBar().setDisplayShowTitleEnabled(enabled);

    // Makes the icon/title clickable
    // getActionBar().setHomeButtonEnabled(enabled);

    private class HighlighterAdapter extends ArrayAdapter<String> {

        // Move "No Highlights" on top. Sort the rest alphabetically
        private class HighlighterComparator implements Comparator<String> {
            @Override
            public int compare(String lhs, String rhs) {
                if (lhs.equals("No Highlights"))
                    return -1000;
                else if (rhs.equals("No Highlights"))
                    return 1000;
                else
                    return lhs.compareTo(rhs);
            }
        }

        private HighlighterComparator mComparator = new HighlighterComparator();

        public HighlighterAdapter() {
            super(mIitc, android.R.layout.simple_list_item_1);
            clear();
        }

        @Override
        public void add(String object) {
            super.remove(object); // to avoid duplicates
            super.add(object);
            super.sort(mComparator);
        }

        @Override
        public void clear() {
            super.clear();
            add("No Highlights");// Probably must be the same as window._no_highlighter
        }
    };

    private class NavigationAdapter extends ArrayAdapter<Pane> {
        public NavigationAdapter() {
            super(mIitc, R.layout.list_item_selectable);

            add(Pane.MAP);
            add(Pane.INFO);
            add(Pane.FULL);
            add(Pane.COMPACT);
            add(Pane.PUBLIC);
            add(Pane.FACTION);

            if (mPrefs.getBoolean("pref_advanced_menu", false))
                add(Pane.DEBUG);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            TextView view = (TextView) super.getView(position, convertView, parent);
            Pane item = getItem(position);
            if (item == Pane.MAP)
                view.setText("Map");
            else
                view.setText(getPaneTitle(item));

            int icon = 0;
            switch (item)
            {
                case MAP:
                    icon = R.drawable.location_map;
                    break;
                case INFO:
                    icon = R.drawable.action_about;
                    break;
                case FULL:
                case COMPACT:
                case PUBLIC:
                case FACTION:
                    icon = R.drawable.social_group;
                    break;
            }

            if (icon != 0)
                view.setCompoundDrawablesWithIntrinsicBounds(icon, 0, 0, 0);

            return view;
        }
    }

    public static enum Pane {
        COMPACT, DEBUG, FACTION, FULL, INFO, MAP, PUBLIC
    }

    private IITC_Mobile mIitc;
    private ActionBar mActionBar;
    private SharedPreferences mPrefs;
    private HighlighterAdapter mHighlighters;
    private NavigationAdapter mNavigationAdapter;
    private DrawerLayout mDrawerLayout;
    private ListView mDrawerList;

    private String mActiveHighlighter = null;
    private boolean mDesktopMode = false;
    private boolean mDrawerOpened;
    private boolean mFullscreen = false;
    private boolean mIsLoading;
    private boolean mHideInFullscreen = false;
    private Pane mPane = Pane.MAP;

    public IITC_NavigationHelper(IITC_Mobile activity, ActionBar bar, ListView drawerList, DrawerLayout drawerLayout) {
        super(activity, drawerLayout, R.drawable.ic_drawer, R.string.drawer_open, R.string.drawer_close);

        mIitc = activity;
        mActionBar = bar;
        mDrawerList = drawerList;
        mDrawerLayout = drawerLayout;

        mPrefs = PreferenceManager.getDefaultSharedPreferences(activity);
        mHighlighters = new HighlighterAdapter();

        mActionBar.setDisplayShowHomeEnabled(true); // show icon
        mActionBar.setListNavigationCallbacks(mHighlighters, this);

        mNavigationAdapter = new NavigationAdapter();
        mDrawerList.setAdapter(mNavigationAdapter);
        mDrawerList.setOnItemClickListener(this);
        mDrawerList.setItemChecked(0, true);
        mDrawerLayout.setDrawerListener(this);

        onPrefChanged(); // also calls updateActionBar()
    }

    private void updateActionBar() {
        boolean showHighlighter = true;

        int position = mNavigationAdapter.getPosition(mPane);
        if (position >= 0 && position < mNavigationAdapter.getCount())
            mDrawerList.setItemChecked(position, true);

        if (mDesktopMode) {
            mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
            mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            mActionBar.setTitle(mIitc.getString(R.string.app_name));
            mDrawerLayout.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED);
            setDrawerIndicatorEnabled(false);
        } else {
            if (mIsLoading) {
                mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
                mActionBar.setHomeButtonEnabled(false);// Make icon unclickable
                mDrawerLayout.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED);
                setDrawerIndicatorEnabled(false);
            } else {
                mActionBar.setDisplayHomeAsUpEnabled(true); // Show "up" indicator
                mActionBar.setHomeButtonEnabled(true);// Make icon clickable
                mDrawerLayout.setDrawerLockMode(DrawerLayout.LOCK_MODE_UNLOCKED);

                if (mPane != Pane.MAP)
                    setDrawerIndicatorEnabled(false);
                else
                    setDrawerIndicatorEnabled(true);
            }

            if (mPane != Pane.MAP)
                showHighlighter = false;

            mActionBar.setTitle(getPaneTitle(mPane));
        }

        if (mHighlighters.getCount() < 2) // there should always be "No Highlights"
            showHighlighter = false;

        if (mDrawerOpened)
            showHighlighter = false;

        if (showHighlighter) {
            mActionBar.setDisplayShowTitleEnabled(false); // Hide title
            mActionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_LIST);
            setActiveHighlighter(mActiveHighlighter);
        } else {
            mActionBar.setDisplayShowTitleEnabled(true); // Show title
            mActionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
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

    public void closeDrawer() {
        mDrawerLayout.closeDrawers();
    }

    public String getPaneTitle(Pane pane)
    {
        switch (pane) {
            case INFO:
                return "Info";
            case FULL:
                return "Full";
            case COMPACT:
                return "Compact";
            case PUBLIC:
                return "Public";
            case FACTION:
                return "Faction";
            case DEBUG:
                return "Debug";
            default:
                return mIitc.getString(R.string.app_name);
        }
    }

    public boolean isDrawerOpened() {
        return mDrawerOpened;
    }

    public boolean hideInFullscreen() {
        return mHideInFullscreen;
    }

    @Override
    public void onDrawerClosed(View drawerView) {
        // TODO change menu? (via invalidateOptionsMenu)
        super.onDrawerClosed(drawerView);
        mDrawerOpened = false;
        updateActionBar();
    }

    @Override
    public void onDrawerOpened(View drawerView) {
        // TODO change menu? (via invalidateOptionsMenu)
        super.onDrawerOpened(drawerView);
        mDrawerOpened = true;
        updateActionBar();
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        Pane item = mNavigationAdapter.getItem(position);
        mIitc.switchToPane(item);
        mDrawerLayout.closeDrawer(mDrawerList);
    }

    @Override
    public boolean onNavigationItemSelected(int position, long itemId) {
        String name = mHighlighters.getItem(position);
        mIitc.getWebView().loadUrl("javascript: window.changePortalHighlights('" + name + "')");

        return true;
    }

    public void onPostCreate(Bundle savedInstanceState) {
        // Sync the toggle state after onRestoreInstanceState has occurred.
        syncState();
    }

    public void onPrefChanged() {
        mDesktopMode = mPrefs.getBoolean("pref_force_desktop", false);
        mHideInFullscreen = mPrefs.getBoolean("pref_fullscreen_actionbar", false);
        updateActionBar();
    }

    public void reset() {
        mHighlighters.clear();
        mPane = Pane.MAP;
        updateActionBar();
    }

    public void setActiveHighlighter(String name) {
        mActiveHighlighter = name;

        if (mActionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_LIST) {
            int position = mHighlighters.getPosition(mActiveHighlighter);
            if (position >= 0 && position < mActionBar.getNavigationItemCount())
                mActionBar.setSelectedNavigationItem(position);
        }
    }

    public void setDebugMode(boolean enabled) {
        mNavigationAdapter.remove(Pane.DEBUG); // avoid duplicates
        if (enabled)
            mNavigationAdapter.add(Pane.DEBUG);
    }

    public void setFullscreen(boolean fullscreen) {
        mFullscreen = fullscreen;
        if (mFullscreen && mHideInFullscreen) {
            // show a toast with instructions to exit the fullscreen mode again
            Toast.makeText(mIitc, "Press back button to exit fullscreen", Toast.LENGTH_SHORT).show();
        }

        updateActionBar();
    }

    public void setLoadingState(boolean isLoading) {
        mIsLoading = isLoading;
        updateActionBar();
    }

    public void switchTo(Pane pane) {
        mPane = pane;

        updateActionBar();
    }
}
