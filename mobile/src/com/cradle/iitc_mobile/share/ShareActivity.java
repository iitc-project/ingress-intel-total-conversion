package com.cradle.iitc_mobile.share;

import android.app.ActionBar;
import android.app.FragmentTransaction;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.NavUtils;
import android.support.v4.view.ViewPager;
import android.view.MenuItem;

import com.cradle.iitc_mobile.R;

public class ShareActivity extends FragmentActivity implements ActionBar.TabListener {
    private boolean mIsPortal;
    private String mLl;
    private String mTitle;
    private int mZoom;
    IntentFragmentAdapter mFragmentAdapter;
    ViewPager mViewPager;

    private void addTab(Intent intent, int label, int icon)
    {
        IntentFragment fragment = new IntentFragment();
        Bundle args = new Bundle();
        args.putParcelable("intent", intent);
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

    private void setupIntents() {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, getUrl());
        intent.putExtra(Intent.EXTRA_SUBJECT, mTitle);
        addTab(intent, R.string.tab_share, R.drawable.share);

        String geoUri = "geo:" + mLl;
        intent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(geoUri));
        addTab(intent, R.string.tab_map, R.drawable.location_map);

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

        if (mTitle == null) {
            mTitle = "Intel Map";
            mIsPortal = false;
        }

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
        mViewPager.setCurrentItem(tab.getPosition());
    }

    @Override
    public void onTabUnselected(ActionBar.Tab tab, FragmentTransaction fragmentTransaction) {
    }
}
