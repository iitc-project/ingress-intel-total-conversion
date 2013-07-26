package com.cradle.iitc_mobile.share;

import java.util.List;

import com.cradle.iitc_mobile.R;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;

public class IntentListView extends ListView {
    private class IntentAdapter extends ArrayAdapter<ResolveInfo>
    {
        private IntentAdapter()
        {
            super(IntentListView.this.getContext(), android.R.layout.simple_list_item_1);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            LayoutInflater inflater = ((Activity) getContext()).getLayoutInflater();
            TextView view = (TextView) inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

            ActivityInfo info = getItem(position).activityInfo;
            CharSequence label = info.loadLabel(mPackageManager);
            Drawable icon = info.loadIcon(mPackageManager);

            view.setText(label);
            view.setCompoundDrawablePadding((int) getResources().getDimension(R.dimen.icon_margin));
            view.setCompoundDrawablesRelativeWithIntrinsicBounds(icon, null, null, null);

            return view;
        }
    }

    private IntentAdapter mAdapter;
    private PackageManager mPackageManager;
    private Intent mIntent = null;

    public IntentListView(Context context) {
        super(context);
        init();
    }

    public IntentListView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public IntentListView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init();
    }

    private void init() {
        mPackageManager = getContext().getPackageManager();
        mAdapter = new IntentAdapter();
        setAdapter(mAdapter);
    }

    public ResolveInfo getItem(int position) {
        return mAdapter.getItem(position);
    }

    public void setIntent(Intent intent)
    {
        mIntent = intent;

        mAdapter.setNotifyOnChange(false);
        mAdapter.clear();

        String packageName = getContext().getPackageName();
        // TODO find default, show on top
        // TODO exclude IITCm

        List<ResolveInfo> activities = mPackageManager.queryIntentActivities(intent, 0);
        ResolveInfo defaultTarget = mPackageManager.resolveActivity(intent, 0);

        boolean hasCopyIntent = false;
        for (ResolveInfo resolveInfo : activities) { // search for "Copy to clipboard" target, provided by Drive
            if (resolveInfo.activityInfo.name.equals("com.google.android.apps.docs.app.SendTextToClipboardActivity")
                    && resolveInfo.activityInfo.packageName.equals("com.google.android.apps.docs"))
                hasCopyIntent = true;
        }

        for (int i = 0; i < activities.size(); i++) { // use traditional loop since List may change during interation
            ResolveInfo info = activities.get(i);
            ActivityInfo activity = info.activityInfo;

            // remove all IITCm intents, except for SendToClipboard in case Drive is not installed
            if (activity.packageName.equals(packageName))
            {
                if (hasCopyIntent || !activity.name.equals(SendToClipboard.class.getCanonicalName()))
                {
                    activities.remove(i);
                    i--;
                    continue;
                }
            }

            // move default Intent to top
            if (info.activityInfo.packageName.equals(defaultTarget.activityInfo.packageName)
                    && info.activityInfo.name.equals(defaultTarget.activityInfo.name))
            {
                activities.remove(i);
                activities.add(0, info);
            }
        }

        mAdapter.addAll(activities);
        mAdapter.setNotifyOnChange(true);
        mAdapter.notifyDataSetChanged();
    }

    public Intent getTargetIntent(int position) {
        ActivityInfo activity = mAdapter.getItem(position).activityInfo;

        Intent intent = new Intent(mIntent)
                .setComponent(new ComponentName(activity.packageName, activity.name))
                .setPackage(activity.packageName);

        return intent;
    }
}
