package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;

import com.cradle.iitc_mobile.Log;
import com.cradle.iitc_mobile.R;

import java.util.Collections;
import java.util.List;

public class IntentListView extends ListView {
    private IntentAdapter mAdapter;
    private PackageManager mPackageManager;

    public IntentListView(final Context context) {
        super(context);
        init();
    }

    public IntentListView(final Context context, final AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public IntentListView(final Context context, final AttributeSet attrs, final int defStyle) {
        super(context, attrs, defStyle);
        init();
    }

    private void init() {
        mPackageManager = getContext().getPackageManager();
        mAdapter = new IntentAdapter();
        setAdapter(mAdapter);
    }

    public Intent getItem(final int position) {
        return mAdapter.getItem(position);
    }

    public void setIntents(final List<Intent> intents) {
        Collections.sort(intents, ((ShareActivity) getContext()).getIntentComparator());

        mAdapter.setNotifyOnChange(false);
        mAdapter.clear();
        mAdapter.addAll(intents);
        mAdapter.notifyDataSetChanged();
    }

    private class IntentAdapter extends ArrayAdapter<Intent> {

        // actually the mdpi pixel size is 48, but this looks ugly...so scale icons down for listView
        private static final int MDPI_PX = 36;

        private IntentAdapter() {
            super(IntentListView.this.getContext(), android.R.layout.simple_list_item_1);
        }

        @Override
        public View getView(final int position, final View convertView, final ViewGroup parent) {
            final LayoutInflater inflater = ((Activity) getContext()).getLayoutInflater();
            final TextView view = (TextView) inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

            final Intent item = getItem(position);

            view.setText(IntentGenerator.getTitle(item));
            view.setCompoundDrawablePadding((int) getResources().getDimension(R.dimen.icon_margin));

            // get icon and scale it manually to ensure that all have the same size
            final DisplayMetrics dm = new DisplayMetrics();
            ((Activity) getContext()).getWindowManager().getDefaultDisplay().getMetrics(dm);
            final float densityScale = dm.density;
            final float scaledWidth = MDPI_PX * densityScale;
            final float scaledHeight = MDPI_PX * densityScale;

            try {
                final Drawable icon = mPackageManager.getActivityIcon(item);
                icon.setBounds(0, 0, Math.round(scaledWidth), Math.round(scaledHeight));
                view.setCompoundDrawables(icon, null, null, null);
            } catch (final NameNotFoundException e) {
                Log.e(e);
            }

            return view;
        }
    }
}
