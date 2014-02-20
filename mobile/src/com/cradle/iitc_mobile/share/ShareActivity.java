package com.cradle.iitc_mobile.share;

import android.app.ActionBar;
import android.app.FragmentTransaction;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.NavUtils;
import android.support.v4.view.ViewPager;
import android.view.MenuItem;

import com.cradle.iitc_mobile.R;

import java.util.ArrayList;

public class ShareActivity extends FragmentActivity implements ActionBar.TabListener {
    private IntentComparator mComparator;
    private FragmentAdapter mFragmentAdapter;
    private IntentGenerator mGenerator;
    private boolean mIsPortal;
    private String mLl;
    private SharedPreferences mSharedPrefs = null;
    private String mTitle;
    private ViewPager mViewPager;
    private int mZoom;

    private void addTab(final ArrayList<Intent> intents, final int label, final int icon) {
        final IntentListFragment fragment = new IntentListFragment();
        final Bundle args = new Bundle();
        args.putParcelableArrayList("intents", intents);
        args.putString("title", getString(label));
        args.putInt("icon", icon);
        fragment.setArguments(args);
        mFragmentAdapter.add(fragment);
    }

    private String getIntelUrl() {
        String url = "http://www.ingress.com/intel?ll=" + mLl + "&z=" + mZoom;
        if (mIsPortal) {
            url += "&pll=" + mLl;
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
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_share);

        mComparator = new IntentComparator(this);
        mGenerator = new IntentGenerator(this);

        mFragmentAdapter = new FragmentAdapter(getSupportFragmentManager());

        final ActionBar actionBar = getActionBar();
        actionBar.setDisplayHomeAsUpEnabled(true);

        final Intent intent = getIntent();
        // from portallinks/permalinks we build 3 intents (share / geo / vanilla-intel-link)
        if (!intent.getBooleanExtra("onlyShare", false)) {
            mTitle = intent.getStringExtra("title");
            mLl = intent.getDoubleExtra("lat", 0) + "," + intent.getDoubleExtra("lng", 0);
            mZoom = intent.getIntExtra("zoom", 0);
            mIsPortal = intent.getBooleanExtra("isPortal", false);

            actionBar.setTitle(mTitle);

            addTab(mGenerator.getShareIntents(mTitle, getIntelUrl()),
                    R.string.tab_share,
                    R.drawable.ic_action_share);
            addTab(mGenerator.getGeoIntents(mTitle, mLl, mZoom),
                    R.string.tab_map,
                    R.drawable.ic_action_place);
            addTab(mGenerator.getBrowserIntents(mTitle, getIntelUrl()),
                    R.string.tab_browser,
                    R.drawable.ic_action_web_site);
        } else {
            mTitle = getString(R.string.app_name);
            final String shareString = intent.getStringExtra("shareString");

            addTab(mGenerator.getShareIntents(mTitle, shareString), R.string.tab_share, R.drawable.ic_action_share);
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

        mSharedPrefs = PreferenceManager.getDefaultSharedPreferences(this);
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
        startActivity(intent);
        finish();
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
