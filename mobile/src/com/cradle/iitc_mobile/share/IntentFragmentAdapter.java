package com.cradle.iitc_mobile.share;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;

import java.util.ArrayList;
import java.util.List;

public class IntentFragmentAdapter extends FragmentPagerAdapter {
    private final List<IntentFragment> mTabs;

    public IntentFragmentAdapter(FragmentManager fm) {
        super(fm);

        mTabs = new ArrayList<IntentFragment>();
    }

    public void add(IntentFragment fragment) {
        mTabs.add(fragment);
    }

    @Override
    public int getCount() {
        return mTabs.size();
    }

    @Override
    public Fragment getItem(int position) {
        return mTabs.get(position);
    }

    @Override
    public CharSequence getPageTitle(int position) {
        return mTabs.get(position).getTitle();
    }
}