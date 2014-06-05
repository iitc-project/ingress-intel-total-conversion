package com.cradle.iitc_mobile.share;

import android.app.ActionBar;
import android.app.FragmentTransaction;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.NavUtils;
import android.support.v4.view.ViewPager;
import android.view.MenuItem;

import com.cradle.iitc_mobile.Log;
import com.cradle.iitc_mobile.R;

import java.io.File;
import java.util.ArrayList;

public class ShareActivity extends FragmentActivity implements ActionBar.TabListener {
    private static final String EXTRA_TYPE = "share-type";
    private static final int REQUEST_START_INTENT = 1;
    private static final String TYPE_FILE = "file";
    private static final String TYPE_PERMALINK = "permalink";
    private static final String TYPE_PORTAL_LINK = "portal_link";
    private static final String TYPE_STRING = "string";

    public static Intent forFile(final Context context, final File file, final String type) {
        return new Intent(context, ShareActivity.class)
                .putExtra(EXTRA_TYPE, TYPE_FILE)
                .putExtra("uri", Uri.fromFile(file))
                .putExtra("type", type);
    }

    public static Intent forPosition(final Context context, final double lat, final double lng, final int zoom,
            final String title, final boolean isPortal) {
        return new Intent(context, ShareActivity.class)
                .putExtra(EXTRA_TYPE, isPortal ? TYPE_PORTAL_LINK : TYPE_PERMALINK)
                .putExtra("lat", lat)
                .putExtra("lng", lng)
                .putExtra("zoom", zoom)
                .putExtra("title", title)
                .putExtra("isPortal", isPortal);
    }

    public static Intent forString(final Context context, final String str) {
        return new Intent(context, ShareActivity.class)
                .putExtra(EXTRA_TYPE, TYPE_STRING)
                .putExtra("shareString", str);
    }

    private IntentComparator mComparator;
    private FragmentAdapter mFragmentAdapter;
    private IntentGenerator mGenerator;
    private SharedPreferences mSharedPrefs = null;
    private ViewPager mViewPager;

    private void addTab(final ArrayList<Intent> intents, final int label, final int icon) {
        final IntentListFragment fragment = new IntentListFragment();
        final Bundle args = new Bundle();
        args.putParcelableArrayList("intents", intents);
        args.putString("title", getString(label));
        args.putInt("icon", icon);
        fragment.setArguments(args);
        mFragmentAdapter.add(fragment);
    }

    private String getIntelUrl(final String ll, final int zoom, final boolean isPortal) {
        final String scheme = mSharedPrefs.getBoolean("pref_force_https", true) ? "https" : "http";
        String url = scheme + "://www.ingress.com/intel?ll=" + ll + "&z=" + zoom;
        if (isPortal) {
            url += "&pll=" + ll;
        }
        return url;
    }

    private void setSelected(final int position) {
        // Activity not fully loaded yet (may occur during tab creation)
        if (mSharedPrefs == null) return;

        mSharedPrefs
                .edit()
                .putInt("pref_share_selected_tab", position)
                .apply();
    }

    @Override
    protected void onActivityResult(final int requestCode, final int resultCode, final Intent data) {
        if (REQUEST_START_INTENT == requestCode) {
            setResult(resultCode, data);
            // parent activity can now clean up
            finish();
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_share);

        mComparator = new IntentComparator(this);
        mGenerator = new IntentGenerator(this);

        mFragmentAdapter = new FragmentAdapter(getSupportFragmentManager());

        mSharedPrefs = PreferenceManager.getDefaultSharedPreferences(this);

        final ActionBar actionBar = getActionBar();
        actionBar.setDisplayHomeAsUpEnabled(true);

        final Intent intent = getIntent();
        final String type = intent.getStringExtra(EXTRA_TYPE);
        // from portallinks/permalinks we build 3 intents (share / geo / vanilla-intel-link)
        if (TYPE_PERMALINK.equals(type) || TYPE_PORTAL_LINK.equals(type)) {
            final String title = intent.getStringExtra("title");
            final String ll = intent.getDoubleExtra("lat", 0) + "," + intent.getDoubleExtra("lng", 0);
            final int zoom = intent.getIntExtra("zoom", 0);
            final String url = getIntelUrl(ll, zoom, TYPE_PORTAL_LINK.equals(type));

            actionBar.setTitle(title);

            addTab(mGenerator.getShareIntents(title, url),
                    R.string.tab_share,
                    R.drawable.ic_action_share);
            addTab(mGenerator.getGeoIntents(title, ll, zoom),
                    R.string.tab_map,
                    R.drawable.ic_action_place);
            addTab(mGenerator.getBrowserIntents(title, url),
                    R.string.tab_browser,
                    R.drawable.ic_action_web_site);
        } else if (TYPE_STRING.equals(type)) {
            final String title = getString(R.string.app_name);
            final String shareString = intent.getStringExtra("shareString");

            addTab(mGenerator.getShareIntents(title, shareString), R.string.tab_share, R.drawable.ic_action_share);
        } else if (TYPE_FILE.equals(type)) {

            final Uri uri = intent.getParcelableExtra("uri");
            final String mime = intent.getStringExtra("type");

            addTab(mGenerator.getShareIntents(uri, mime), R.string.tab_share, R.drawable.ic_action_share);
        } else {
            Log.w("Unknown sharing type: " + type);
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        mViewPager = (ViewPager) findViewById(R.id.pager);
        mViewPager.setAdapter(mFragmentAdapter);

        mViewPager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener() {
            @Override
            public void onPageSelected(final int position) {
                if (actionBar.getNavigationMode() != ActionBar.NAVIGATION_MODE_STANDARD) {
                    actionBar.setSelectedNavigationItem(position);
                }
                setSelected(position);
            }
        });

        for (int i = 0; i < mFragmentAdapter.getCount(); i++) {
            final IntentListFragment fragment = (IntentListFragment) mFragmentAdapter.getItem(i);

            actionBar.addTab(actionBar
                    .newTab()
                    .setText(fragment.getTitle())
                    .setIcon(fragment.getIcon())
                    .setTabListener(this));
        }

        if (mFragmentAdapter.getCount() > 1) {
            actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
        }

        final int selected = mSharedPrefs.getInt("pref_share_selected_tab", 0);
        if (selected < mFragmentAdapter.getCount()) {
            mViewPager.setCurrentItem(selected);
            if (actionBar.getNavigationMode() != ActionBar.NAVIGATION_MODE_STANDARD) {
                actionBar.setSelectedNavigationItem(selected);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mComparator.save();
    }

    public IntentComparator getIntentComparator() {
        return mComparator;
    }

    public void launch(final Intent intent) {
        mComparator.trackIntentSelection(intent);
        mGenerator.cleanup(intent);

        // we should wait for the new intent to be finished so the calling activity (IITC_Mobile) can clean up
        startActivityForResult(intent, REQUEST_START_INTENT);
    }

    @Override
    public boolean onOptionsItemSelected(final MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                NavUtils.navigateUpFromSameTask(this);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onTabReselected(final ActionBar.Tab tab, final FragmentTransaction fragmentTransaction) {
    }

    @Override
    public void onTabSelected(final ActionBar.Tab tab, final FragmentTransaction fragmentTransaction) {
        final int position = tab.getPosition();
        mViewPager.setCurrentItem(position);
        setSelected(position);
    }

    @Override
    public void onTabUnselected(final ActionBar.Tab tab, final FragmentTransaction fragmentTransaction) {
    }
}
