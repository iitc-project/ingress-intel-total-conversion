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
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;

public class ShareActivity extends FragmentActivity implements ActionBar.TabListener {
    private boolean mIsPortal;
    private String mLl;
    private SharedPreferences mSharedPrefs = null;
    private String mTitle;
    private int mZoom;
    IntentFragmentAdapter mFragmentAdapter;
    ViewPager mViewPager;

    private void addTab(Intent intent, int label, int icon)
    {
        ArrayList<Intent> intents = new ArrayList<Intent>(1);
        intents.add(intent);
        addTab(intents, label, icon);
    }

    private void addTab(ArrayList<Intent> intents, int label, int icon)
    {
        IntentFragment fragment = new IntentFragment();
        Bundle args = new Bundle();
        args.putParcelableArrayList("intents", intents);
        args.putString("title", getString(label));
        args.putInt("icon", icon);
        fragment.setArguments(args);
        mFragmentAdapter.add(fragment);
    }

    private String getUrl() {
        String url = "http://www.ingress.com/intel?ll=" + mLl + "&z=" + mZoom;
        if (mIsPortal)
            url += "&pll=" + mLl;
        return url;
    }

    private void setSelected(int position) {
        // Activity not fully loaded yet (may occur during tab creation)
        if (mSharedPrefs == null)
            return;

        mSharedPrefs
                .edit()
                .putInt("pref_share_selected_tab", position)
                .apply();
    }

    private void setupIntents() {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, getUrl());
        intent.putExtra(Intent.EXTRA_SUBJECT, mTitle);
        addTab(intent, R.string.tab_share, R.drawable.share);

        // we merge gmaps intents with geo intents since it is not possible
        // anymore to set a labeled marker on geo intents
        ArrayList<Intent> intents = new ArrayList<Intent>();
        DecimalFormatSymbols decFormat = new DecimalFormatSymbols();
        // thx to gmaps, this only works for the decimal point separator
        String gMapsUri;
        if (decFormat.getDecimalSeparator() == '.')
            try {
                gMapsUri = "http://maps.google.com/maps?q=loc:" + mLl + "%20(" + URLEncoder.encode(mTitle, "UTF-8") + ")&z=" + mZoom;
            } catch (UnsupportedEncodingException e) {
                gMapsUri = "http://maps.google.com/maps?ll=" + mLl + "&z=" + mZoom;
                e.printStackTrace();
            }
        else
            gMapsUri = "http://maps.google.com/maps?ll=" + mLl + "&z=" + mZoom;
        Intent gMapsIntent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(gMapsUri));
        intents.add(gMapsIntent);
        String geoUri = "geo:" + mLl;
        Intent geoIntent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(geoUri));
        intents.add(geoIntent);
        addTab(intents, R.string.tab_map, R.drawable.location_map);

        intent = new Intent(Intent.ACTION_VIEW, Uri.parse(getUrl()));
        addTab(intent, R.string.tab_browser, R.drawable.browser);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_share);

        Intent intent = getIntent();
        mTitle = intent.getStringExtra("title");
        mLl = intent.getDoubleExtra("lat", 0) + "," + intent.getDoubleExtra("lng", 0);
        mZoom = intent.getIntExtra("zoom", 0);
        mIsPortal = intent.getBooleanExtra("isPortal", false);

        final ActionBar actionBar = getActionBar();
        actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
        actionBar.setDisplayHomeAsUpEnabled(true);

        mFragmentAdapter = new IntentFragmentAdapter(getSupportFragmentManager());
        setupIntents();

        mViewPager = (ViewPager) findViewById(R.id.pager);
        mViewPager.setAdapter(mFragmentAdapter);

        mViewPager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener() {
            @Override
            public void onPageSelected(int position) {
                actionBar.setSelectedNavigationItem(position);
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

        mSharedPrefs = PreferenceManager.getDefaultSharedPreferences(this);
        int selected = mSharedPrefs.getInt("pref_share_selected_tab", 0);
        if (selected < mFragmentAdapter.getCount())
        {
            mViewPager.setCurrentItem(selected);
            actionBar.setSelectedNavigationItem(selected);
        }
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
