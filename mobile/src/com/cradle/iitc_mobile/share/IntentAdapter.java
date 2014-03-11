package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.graphics.drawable.Drawable;
import android.util.DisplayMetrics;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.cradle.iitc_mobile.Log;
import com.cradle.iitc_mobile.R;

import java.util.Collections;
import java.util.List;

class IntentAdapter extends ArrayAdapter<Intent> {
    private static final int MDPI_PX = 36;

    private final PackageManager mPackageManager;

    public IntentAdapter(final Context context) {
        super(context, android.R.layout.simple_list_item_1);
        mPackageManager = getContext().getPackageManager();
    }

    @Override
    public View getView(final int position, final View convertView, final ViewGroup parent) {
        final LayoutInflater inflater = ((Activity) getContext()).getLayoutInflater();
        final TextView view = (TextView) inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

        final Intent item = getItem(position);

        try {
            view.setText(IntentGenerator.getTitle(item));
        } catch (IllegalArgumentException e) {
            view.setText("unknown");
            Log.w(e);
        }
        view.setCompoundDrawablePadding((int) getContext().getResources().getDimension(R.dimen.icon_margin));

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

    public void setIntents(final List<Intent> intents) {
        Collections.sort(intents, ((ShareActivity) getContext()).getIntentComparator());

        setNotifyOnChange(false);
        clear();
        addAll(intents);
        notifyDataSetChanged();
    }
}