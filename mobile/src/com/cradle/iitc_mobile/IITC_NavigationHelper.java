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
import android.text.method.LinkMovementMethod;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;

public class IITC_NavigationHelper extends ActionBarDrawerToggle implements OnItemClickListener {
    // Show/hide the up arrow on the very left
    // getActionBar().setDisplayHomeAsUpEnabled(enabled);

    // Show/hide the activity icon/logo
    // getActionBar().setDisplayShowHomeEnabled(enabled);

    // Show/hide the activity title
    // getActionBar().setDisplayShowTitleEnabled(enabled);

    // Makes the icon/title clickable
    // getActionBar().setHomeButtonEnabled(enabled);

    public static final int NOTICE_DRAWERS = 1 << 0;
    public static final int NOTICE_INFO = 1 << 1;
    public static final int NOTICE_PANES = 1 << 2;
    // next one would be 1<<2; (this results in 1,2,4,8,...)

    private final IITC_Mobile mIitc;
    private final ActionBar mActionBar;
    private final SharedPreferences mPrefs;
    private final NavigationAdapter mNavigationAdapter;
    private final DrawerLayout mDrawerLayout;
    private final ListView mDrawerLeft;
    private final View mDrawerRight;

    private boolean mDesktopMode = false;
    private boolean mIsLoading;
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
        if ((mPrefs.getInt("pref_messages", 0) & which) != 0) return;

        String text;
        switch (which) {
            case NOTICE_DRAWERS:
                text = mIitc.getText(R.string.notice_how_to).toString();
                break;
            case NOTICE_INFO:
                text = mIitc.getText(R.string.notice_info).toString();
                break;
            case NOTICE_PANES:
                text = mIitc.getText(R.string.notice_panes).toString();
                break;
            default:
                return;
        }

        TextView message = new TextView(mIitc);
        message.setPadding(20, 20, 20, 20);
        message.setText(Html.fromHtml(text));
        message.setMovementMethod(LinkMovementMethod.getInstance());

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

    private void updateViews() {
        int position = mNavigationAdapter.getPosition(mPane);
        if (position >= 0 && position < mNavigationAdapter.getCount()) {
            mDrawerLeft.setItemChecked(position, true);
        } else {
            mDrawerLeft.setItemChecked(mDrawerLeft.getCheckedItemPosition(), false);
        }

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

                if (mPane == Pane.MAP || mDrawerLayout.isDrawerOpen(mDrawerLeft)) {
                    setDrawerIndicatorEnabled(true);
                } else {
                    setDrawerIndicatorEnabled(false);
                }
            }

            if (mDrawerLayout.isDrawerOpen(mDrawerLeft)) {
                mActionBar.setTitle(mIitc.getString(R.string.app_name));
            } else {
                mActionBar.setTitle(mPane.label);
            }
        }

        boolean mapVisible = mDesktopMode || mPane == Pane.MAP;
        if ("No Highlights".equals(mHighlighter) || isDrawerOpened() || mIsLoading || !mapVisible) {
            mActionBar.setSubtitle(null);
        } else {
            mActionBar.setSubtitle(mHighlighter);
        }
    }

    public void addPane(String name, String label, String icon) {
        showNotice(NOTICE_PANES);

        int resId = mIitc.getResources().getIdentifier(icon, "drawable", mIitc.getPackageName());
        mNavigationAdapter.add(new Pane(name, label, resId));
    }

    public void closeDrawers() {
        mDrawerLayout.closeDrawers();
    }

    public Pane getPane(String id) {
        for (int i = 0; i < mNavigationAdapter.getCount(); i++) {
            Pane pane = mNavigationAdapter.getItem(i);
            if (pane.name.equals(id))
                return pane;
        }
        throw new IllegalArgumentException("Unknown pane: " + id);
    }

    public void hideActionBar() {
        mActionBar.hide();
    }

    public boolean isDrawerOpened() {
        return mDrawerLayout.isDrawerOpen(mDrawerLeft) || mDrawerLayout.isDrawerOpen(mDrawerRight);
    }

    @Override
    public void onDrawerClosed(View drawerView) {
        super.onDrawerClosed(drawerView);

        mIitc.getWebView().onWindowFocusChanged(true);
        // delay invalidating to prevent flickering in case another drawer is opened
        (new Handler()).postDelayed(new Runnable() {
            @Override
            public void run() {
                mIitc.invalidateOptionsMenu();
                updateViews();
            }
        }, 200);
    }

    @Override
    public void onDrawerOpened(View drawerView) {
        super.onDrawerOpened(drawerView);
        mIitc.getWebView().onWindowFocusChanged(false);
        mIitc.invalidateOptionsMenu();
        updateViews();
        mDrawerLayout.closeDrawer(drawerView.equals(mDrawerLeft) ? mDrawerRight : mDrawerLeft);
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        Pane item = mNavigationAdapter.getItem(position);
        mIitc.switchToPane(item);

        if (item == Pane.INFO) {
            showNotice(NOTICE_INFO);
        }

        mDrawerLayout.closeDrawer(mDrawerLeft);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            mDrawerLayout.closeDrawer(mDrawerRight);
        }

        return super.onOptionsItemSelected(item);
    }

    public void onPostCreate(Bundle savedInstanceState) {
        // Sync the toggle state after onRestoreInstanceState has occurred.
        syncState();
    }

    public void onPrefChanged() {
        mDesktopMode = mPrefs.getBoolean("pref_force_desktop", false);
        updateViews();
    }

    public void openRightDrawer() {
        if (mDrawerLayout.getDrawerLockMode(mDrawerRight) == DrawerLayout.LOCK_MODE_UNLOCKED) {
            mDrawerLayout.openDrawer(mDrawerRight);
        }
    }

    public void reset() {
        mPane = Pane.MAP;
        mNavigationAdapter.reset();
        updateViews();
    }

    public void setDebugMode(boolean enabled) {
        mNavigationAdapter.reset();
    }

    public void setHighlighter(String name) {
        mHighlighter = name;
        updateViews();
    }

    public void setLoadingState(boolean isLoading) {
        mIsLoading = isLoading;
        updateViews();
    }

    public void showActionBar() {
        mActionBar.show();
    }

    public void switchTo(Pane pane) {
        mPane = pane;

        updateViews();
    }

    private class NavigationAdapter extends ArrayAdapter<Pane> {
        public NavigationAdapter() {
            super(mIitc, R.layout.list_item_selectable);

            reset();
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            TextView view = (TextView) super.getView(position, convertView, parent);
            Pane item = getItem(position);
            view.setText(item.label);

            if (item.icon != 0) {
                view.setCompoundDrawablesWithIntrinsicBounds(item.icon, 0, 0, 0);
            }

            return view;
        }

        public void reset() {
            clear();

            add(Pane.INFO);
            add(Pane.FULL);
            add(Pane.COMPACT);
            add(Pane.PUBLIC);
            add(Pane.FACTION);

            if (mPrefs.getBoolean("pref_advanced_menu", false)) {
                add(Pane.DEBUG);
            }
        }
    }

    public static class Pane {
        public static final Pane COMPACT = new Pane("compact", "Compact", R.drawable.ic_action_view_as_list_compact);
        public static final Pane DEBUG = new Pane("debug", "Debug", R.drawable.ic_action_error);
        public static final Pane FACTION = new Pane("faction", "Faction", R.drawable.ic_action_cc_bcc);
        public static final Pane FULL = new Pane("full", "Full", R.drawable.ic_action_view_as_list);
        public static final Pane INFO = new Pane("info", "Info", R.drawable.ic_action_about);
        public static final Pane MAP = new Pane("map", "IITC Mobile", R.drawable.ic_action_map);
        public static final Pane PUBLIC = new Pane("public", "Public", R.drawable.ic_action_group);

        private int icon;
        public String label;
        public String name;

        public Pane(String name, String label, int icon) {
            this.name = name;
            this.label = label;
            this.icon = icon;
        }

        @Override
        public boolean equals(Object o) {
            if (o == null) return false;
            if (o.getClass() != getClass()) return false;

            Pane pane = (Pane) o;
            return name.equals(pane.name);
        }

        @Override
        public int hashCode() {
            return name.hashCode();
        }
    }
}
