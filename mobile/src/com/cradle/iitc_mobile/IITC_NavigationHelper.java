package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.support.v4.app.ActionBarDrawerToggle;
import android.support.v4.widget.DrawerLayout;
import android.text.Html;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

public class IITC_NavigationHelper extends ActionBarDrawerToggle implements OnItemClickListener {
    // Show/hide the up arrow on the very left
    // getActionBar().setDisplayHomeAsUpEnabled(enabled);

    // Show/hide the activity icon/logo
    // getActionBar().setDisplayShowHomeEnabled(enabled);

    // Show/hide the activity title
    // getActionBar().setDisplayShowTitleEnabled(enabled);

    // Makes the icon/title clickable
    // getActionBar().setHomeButtonEnabled(enabled);

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
                    icon = R.drawable.collections_view_as_list;
                    break;
                case COMPACT:
                    icon = R.drawable.collections_view_as_list_compact;
                    break;
                case PUBLIC:
                    icon = R.drawable.social_group;
                    break;
                case FACTION:
                    icon = R.drawable.social_cc_bcc;
                    break;
                case DEBUG:
                    icon = R.drawable.ic_debug;
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

    public static final int NOTICE_DRAWERS = 1 << 0;
    public static final int NOTICE_INFO = 1 << 1;
    // next one would be 1<<2; (this results in 1,2,4,8,...)

    private IITC_Mobile mIitc;
    private ActionBar mActionBar;
    private SharedPreferences mPrefs;
    private NavigationAdapter mNavigationAdapter;
    private DrawerLayout mDrawerLayout;
    private ListView mDrawerLeft;
    private View mDrawerRight;

    private boolean mDesktopMode = false;
    private boolean mFullscreen = false;
    private boolean mIsLoading;
    private boolean mHideInFullscreen = false;
    private Pane mPane = Pane.MAP;
    private String mHighlighter = null;

    public IITC_NavigationHelper(IITC_Mobile activity, ActionBar bar) {
        super(activity, (DrawerLayout) activity.findViewById(R.id.drawer_layout),
                R.drawable.ic_drawer, R.string.drawer_open, R.string.drawer_close);

        mIitc = activity;
        mActionBar = bar;
        mDrawerLeft = (ListView) activity.findViewById(R.id.left_drawer);
        mDrawerRight = activity.findViewById(R.id.right_drawer);
        mDrawerLayout = (DrawerLayout) activity.findViewById(R.id.drawer_layout);

        mPrefs = PreferenceManager.getDefaultSharedPreferences(activity);

        mActionBar.setDisplayShowHomeEnabled(true); // show icon

        mNavigationAdapter = new NavigationAdapter();
        mDrawerLeft.setAdapter(mNavigationAdapter);
        mDrawerLeft.setOnItemClickListener(this);
        mDrawerLeft.setItemChecked(0, true);
        mDrawerLayout.setDrawerListener(this);

        onPrefChanged(); // also calls updateActionBar()

        showNotice(NOTICE_DRAWERS);
    }

    private void showNotice(final int which) {
        if ((mPrefs.getInt("pref_messages", 0) & which) != 0)
            return;

        String text;
        switch (which) {
            case NOTICE_DRAWERS:
                text = mIitc.getText(R.string.notice_drawers).toString();
                break;
            case NOTICE_INFO:
                text = mIitc.getText(R.string.notice_info).toString();
                break;
            default:
                return;
        }

        TextView message = new TextView(mIitc);
        message.setPadding(20, 20, 20, 20);
        message.setText(Html.fromHtml(text));

        AlertDialog dialog = new AlertDialog.Builder(mIitc)
                .setView(message)
                .setCancelable(true)
                .setPositiveButton(android.R.string.ok, new OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.cancel();
                    }
                })
                .create();
        dialog.setOnDismissListener(new OnDismissListener() {
            @Override
            public void onDismiss(DialogInterface dialog) {
                int value = mPrefs.getInt("pref_messages", 0);
                value |= which;

                mPrefs
                        .edit()
                        .putInt("pref_messages", value)
                        .commit();
            }
        });
        dialog.show();
    }

    private void updateActionBar() {
        int position = mNavigationAdapter.getPosition(mPane);
        if (position >= 0 && position < mNavigationAdapter.getCount())
            mDrawerLeft.setItemChecked(position, true);

        if (mDesktopMode) {
            mActionBar.setDisplayHomeAsUpEnabled(false); // Hide "up" indicator
            mActionBar.setHomeButtonEnabled(false); // Make icon unclickable
            mActionBar.setTitle(mIitc.getString(R.string.app_name));
            mDrawerLayout.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED, mDrawerLeft);
            mDrawerLayout.setDrawerLockMode(DrawerLayout.LOCK_MODE_UNLOCKED, mDrawerRight);
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

                if (mPane == Pane.MAP || mDrawerLayout.isDrawerOpen(mDrawerLeft))
                    setDrawerIndicatorEnabled(true);
                else
                    setDrawerIndicatorEnabled(false);
            }

            if (mDrawerLayout.isDrawerOpen(mDrawerLeft))
                mActionBar.setTitle(mIitc.getString(R.string.app_name));
            else
                mActionBar.setTitle(getPaneTitle(mPane));
        }

        if (mHighlighter != null && !isDrawerOpened() && (mDesktopMode || mPane == Pane.MAP))
            if (!mActionBar.equals("No Highlights"))
                mActionBar.setSubtitle(mHighlighter);
            else
                mActionBar.setSubtitle(null);
        else
            mActionBar.setSubtitle(null);

        if (mFullscreen && mHideInFullscreen)
            mActionBar.hide();
        else
            mActionBar.show();
    }

    public void closeDrawers() {
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

    public boolean hideInFullscreen() {
        return mHideInFullscreen;
    }

    public boolean isDrawerOpened() {
        return mDrawerLayout.isDrawerOpen(mDrawerLeft) || mDrawerLayout.isDrawerOpen(mDrawerRight);
    }

    @Override
    public void onDrawerClosed(View drawerView) {
        super.onDrawerClosed(drawerView);

        // delay invalidating to prevent flickering in case another drawer is opened
        (new Handler()).postDelayed(new Runnable() {
            @Override
            public void run() {
                mIitc.invalidateOptionsMenu();
                updateActionBar();
            }
        }, 200);
    }

    @Override
    public void onDrawerOpened(View drawerView) {
        super.onDrawerOpened(drawerView);
        mIitc.invalidateOptionsMenu();
        updateActionBar();
        mDrawerLayout.closeDrawer(drawerView.equals(mDrawerLeft) ? mDrawerRight : mDrawerLeft);
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        Pane item = mNavigationAdapter.getItem(position);
        mIitc.switchToPane(item);

        if (item == Pane.INFO)
            showNotice(NOTICE_INFO);

        mDrawerLayout.closeDrawer(mDrawerLeft);
    }

    public void onPostCreate(Bundle savedInstanceState) {
        // Sync the toggle state after onRestoreInstanceState has occurred.
        syncState();
    }

    public void onPrefChanged() {
        mDesktopMode = mPrefs.getBoolean("pref_force_desktop", false);
        mHideInFullscreen = mPrefs.getBoolean("pref_fullscreen_actionbar", true);
        updateActionBar();
    }

    public void openRightDrawer() {
        if (mDrawerLayout.getDrawerLockMode(mDrawerRight) == DrawerLayout.LOCK_MODE_UNLOCKED)
            mDrawerLayout.openDrawer(mDrawerRight);
    }

    public void reset() {
        mPane = Pane.MAP;
        updateActionBar();
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

    public void setHighlighter(String name) {
        mHighlighter = name;
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
