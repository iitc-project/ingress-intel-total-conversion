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

import java.util.ArrayList;

public class IntentFragment extends Fragment implements OnScrollListener, OnItemClickListener {
    private ArrayList<Intent> mIntents;
    private IntentListView mListView;
    private int mScrollIndex, mScrollTop;

    public int getIcon() {
        return getArguments().getInt("icon");
    }

    public String getTitle() {
        return getArguments().getString("title");
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Bundle args = getArguments();

        mIntents = args.getParcelableArrayList("intents");
        mListView = new IntentListView(getActivity());
        mListView.setIntents(mIntents);
        if (mScrollIndex != -1 && mScrollTop != -1) {
            mListView.setSelectionFromTop(mScrollIndex, mScrollTop);
        }
        mListView.setOnScrollListener(this);
        mListView.setOnItemClickListener(this);

        return mListView;
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        ((ShareActivity) getActivity()).getIntentComparator().trackIntentSelection(mListView.getItem(position));

        Intent intent = mListView.getTargetIntent(position);
        startActivity(intent);

        getActivity().finish();
    }

    @Override
    public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
        mScrollIndex = mListView.getFirstVisiblePosition();
        View v = mListView.getChildAt(0);
        mScrollTop = (v == null) ? 0 : v.getTop();
    }

    @Override
    public void onScrollStateChanged(AbsListView view, int scrollState) {
    }
}