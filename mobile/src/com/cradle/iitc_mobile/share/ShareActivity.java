package com.cradle.iitc_mobile.share;

import android.app.ActionBar;
import android.app.FragmentTransaction;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.NavUtils;
import android.support.v4.view.ViewPager;
import android.view.MenuItem;

import com.cradle.iitc_mobile.R;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;

public class ShareActivity extends FragmentActivity implements ActionBar.TabListener {
    private IntentComparator mComparator;
    private IntentFragmentAdapter mFragmentAdapter;
    private boolean mIsPortal;
    private String mLl;
    private SharedPreferences mSharedPrefs = null;
    private String mTitle;
    private ViewPager mViewPager;
    private int mZoom;

    private void addTab(ArrayList<Intent> intents, int label, int icon) {
        IntentFragment fragment = new IntentFragment();
        Bundle args = new Bundle();
        args.putParcelableArrayList("intents", intents);
        args.putString("title", getString(label));
        args.putInt("icon", icon);
        fragment.setArguments(args);
        mFragmentAdapter.add(fragment);
    }

    private void addTab(Intent intent, int label, int icon) {
        ArrayList<Intent> intents = new ArrayList<Intent>(1);
        intents.add(intent);
        addTab(intents, label, icon);
    }

    private String getUrl() {
        String url = "http://www.ingress.com/intel?ll=" + mLl + "&z=" + mZoom;
        if (mIsPortal) {
            url += "&pll=" + mLl;
        }
        return url;
    }

    private void setSelected(int position) {
        // Activity not fully loaded yet (may occur during tab creation)
        if (mSharedPrefs == null) return;

        mSharedPrefs
                .edit()
                .putInt("pref_share_selected_tab", position)
                .apply();
    }

    private void setupIntents() {
        setupShareIntent(getUrl());

        // we merge gmaps intents with geo intents since it is not possible
        // anymore to set a labeled marker on geo intents
        ArrayList<Intent> intents = new ArrayList<Intent>();
        String gMapsUri;
        try {
            gMapsUri = "http://maps.google.com/?q=loc:" + mLl
                    + "%20(" + URLEncoder.encode(mTitle, "UTF-8") + ")&z=" + mZoom;
        } catch (UnsupportedEncodingException e) {
            gMapsUri = "http://maps.google.com/?ll=" + mLl + "&z=" + mZoom;
            e.printStackTrace();
        }
        Intent gMapsIntent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(gMapsUri));
        intents.add(gMapsIntent);
        String geoUri = "geo:" + mLl;
        Intent geoIntent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(geoUri));
        intents.add(geoIntent);
        addTab(intents, R.string.tab_map, R.drawable.location_map);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(getUrl()));
        addTab(intent, R.string.tab_browser, R.drawable.browser);
    }

    private void setupShareIntent(String str) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, str);
        intent.putExtra(Intent.EXTRA_SUBJECT, mTitle);
        addTab(intent, R.string.tab_share, R.drawable.share);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_share);

        mComparator = new IntentComparator(this);

        mFragmentAdapter = new IntentFragmentAdapter(getSupportFragmentManager());

        final ActionBar actionBar = getActionBar();
        actionBar.setDisplayHomeAsUpEnabled(true);

        Intent intent = getIntent();
        // from portallinks/permalinks we build 3 intents (share / geo / vanilla-intel-link)
        if (!intent.getBooleanExtra("onlyShare", false)) {
            mTitle = intent.getStringExtra("title");
            mLl = intent.getDoubleExtra("lat", 0) + "," + intent.getDoubleExtra("lng", 0);
            mZoom = intent.getIntExtra("zoom", 0);
            mIsPortal = intent.getBooleanExtra("isPortal", false);

            setupIntents();
        } else {
            mTitle = getString(R.string.app_name);
            setupShareIntent(intent.getStringExtra("shareString"));
        }

        mViewPager = (ViewPager) findViewById(R.id.pager);
        mViewPager.setAdapter(mFragmentAdapter);

        mViewPager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener() {
            @Override
            public void onPageSelected(int position) {
                if (actionBar.getNavigationMode() != ActionBar.NAVIGATION_MODE_STANDARD) {
                    actionBar.setSelectedNavigationItem(position);
                }
                setSelected(position);
            }
        });

        for (int i = 0; i < mFragmentAdapter.getCount(); i++) {
            IntentFragment fragment = (IntentFragment) mFragmentAdapter.getItem(i);

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
        int selected = mSharedPrefs.getInt("pref_share_selected_tab", 0);
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

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
                NavUtils.navigateUpFromSameTask(this);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onTabReselected(ActionBar.Tab tab, FragmentTransaction fragmentTransaction) {
    }

    @Override
    public void onTabSelected(ActionBar.Tab tab, FragmentTransaction fragmentTransaction) {
        int position = tab.getPosition();
        mViewPager.setCurrentItem(position);
        setSelected(position);
    }

    @Override
    public void onTabUnselected(ActionBar.Tab tab, FragmentTransaction fragmentTransaction) {
    }
}
