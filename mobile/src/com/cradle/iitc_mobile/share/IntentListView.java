package com.cradle.iitc_mobile.share;

import java.util.HashSet;
import java.util.List;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.Pair;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;

import com.cradle.iitc_mobile.R;

public class IntentListView extends ListView {
    private static class CopyHandler extends Pair<String, String> {
        public CopyHandler(ResolveInfo resolveInfo) {
            super(resolveInfo.activityInfo.packageName, resolveInfo.activityInfo.name);
        }

        public CopyHandler(String packageName, String name) {
            super(packageName, name);
        }
    }

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
            view.setCompoundDrawablesWithIntrinsicBounds(icon, null, null, null);

            return view;
        }
    }

    private static final HashSet<CopyHandler> KNOWN_COPY_HANDLERS = new HashSet<CopyHandler>();

    private static void setupKnownCopyHandlers() {
        if (!KNOWN_COPY_HANDLERS.isEmpty())
            return;

        KNOWN_COPY_HANDLERS.add(new CopyHandler(
                "com.google.android.apps.docs",
                "com.google.android.apps.docs.app.SendTextToClipboardActivity"));

        KNOWN_COPY_HANDLERS.add(new CopyHandler(
                "com.aokp.romcontrol",
                "com.aokp.romcontrol.ShareToClipboard"));
    }

    private IntentAdapter mAdapter;
    private Intent mIntent = null;
    private PackageManager mPackageManager;

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
        setupKnownCopyHandlers();

        mPackageManager = getContext().getPackageManager();
        mAdapter = new IntentAdapter();
        setAdapter(mAdapter);
    }

    public ResolveInfo getItem(int position) {
        return mAdapter.getItem(position);
    }

    public Intent getTargetIntent(int position) {
        ActivityInfo activity = mAdapter.getItem(position).activityInfo;

        Intent intent = new Intent(mIntent)
                .setComponent(new ComponentName(activity.packageName, activity.name))
                .setPackage(activity.packageName);

        return intent;
    }

    public void setIntent(Intent intent)
    {
        mIntent = intent;

        mAdapter.setNotifyOnChange(false);
        mAdapter.clear();

        String packageName = getContext().getPackageName();

        List<ResolveInfo> activities = mPackageManager.queryIntentActivities(intent, 0);
        ResolveInfo defaultTarget = mPackageManager.resolveActivity(intent, 0);

        boolean hasCopyIntent = false;
        for (ResolveInfo resolveInfo : activities) { // search for "Copy to clipboard" handler
            CopyHandler handler = new CopyHandler(resolveInfo);

            if (KNOWN_COPY_HANDLERS.contains(handler))
                hasCopyIntent = true;
        }

        // use traditional loop since list may change during iteration
        for (int i = 0; i < activities.size(); i++) {
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
}
