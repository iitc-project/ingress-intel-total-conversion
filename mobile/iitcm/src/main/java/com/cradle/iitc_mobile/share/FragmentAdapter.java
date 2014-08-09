package com.cradle.iitc_mobile.share;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;

import java.util.ArrayList;
import java.util.List;

public class FragmentAdapter extends FragmentPagerAdapter {
    private final List<IntentListFragment> mTabs;

    public FragmentAdapter(final FragmentManager fm) {
        super(fm);

        mTabs = new ArrayList<IntentListFragment>();
    }

    public void add(final IntentListFragment fragment) {
        mTabs.add(fragment);
    }

    @Override
    public int getCount() {
        return mTabs.size();
    }

    @Override
    public Fragment getItem(final int position) {
        return mTabs.get(position);
    }

    @Override
    public CharSequence getPageTitle(final int position) {
        return mTabs.get(position).getTitle();
    }
}