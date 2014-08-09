package com.cradle.iitc_mobile.share;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.AbsListView.OnScrollListener;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ListView;

import java.util.ArrayList;

public class IntentListFragment extends Fragment implements OnScrollListener, OnItemClickListener {
    private IntentAdapter mAdapter;
    private ArrayList<Intent> mIntents;
    private ListView mListView;
    private int mScrollIndex, mScrollTop;

    public int getIcon() {
        return getArguments().getInt("icon");
    }

    public String getTitle() {
        return getArguments().getString("title");
    }

    @Override
    public View onCreateView(final LayoutInflater inflater, final ViewGroup container, final Bundle savedInstanceState) {
        final Bundle args = getArguments();

        mIntents = args.getParcelableArrayList("intents");

        mAdapter = new IntentAdapter(getActivity());
        mAdapter.setIntents(mIntents);

        mListView = new ListView(getActivity());
        mListView.setAdapter(mAdapter);
        if (mScrollIndex != -1 && mScrollTop != -1) {
            mListView.setSelectionFromTop(mScrollIndex, mScrollTop);
        }
        mListView.setOnScrollListener(this);
        mListView.setOnItemClickListener(this);

        return mListView;
    }

    @Override
    public void onItemClick(final AdapterView<?> parent, final View view, final int position, final long id) {
        ((ShareActivity) getActivity()).launch(mAdapter.getItem(position));
    }

    @Override
    public void onScroll(final AbsListView lv, final int firstItem, final int visibleItems, final int totalItems) {
        mScrollIndex = mListView.getFirstVisiblePosition();
        final View v = mListView.getChildAt(0);
        mScrollTop = (v == null) ? 0 : v.getTop();
    }

    @Override
    public void onScrollStateChanged(final AbsListView view, final int scrollState) {
    }
}