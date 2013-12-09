package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Pair;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;

import com.cradle.iitc_mobile.R;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

public class IntentListView extends ListView {
    private static class CopyHandler extends Pair<String, String> {
        public CopyHandler(ResolveInfo resolveInfo) {
            super(resolveInfo.activityInfo.packageName, resolveInfo.activityInfo.name);
        }

        public CopyHandler(String packageName, String name) {
            super(packageName, name);
        }
    }

    private class IntentAdapter extends ArrayAdapter<ResolveInfo> {

        // actually the mdpi pixel size is 48, but this looks ugly...so scale icons down for listView
        private static final int MDPI_PX = 36;

        private IntentAdapter() {
            super(IntentListView.this.getContext(), android.R.layout.simple_list_item_1);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            LayoutInflater inflater = ((Activity) getContext()).getLayoutInflater();
            TextView view = (TextView) inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

            ActivityInfo info = getItem(position).activityInfo;
            CharSequence label = info.loadLabel(mPackageManager);

            // get icon and scale it manually to ensure that all have the same size
            Drawable icon = info.loadIcon(mPackageManager);
            DisplayMetrics dm = new DisplayMetrics();
            ((Activity) getContext()).getWindowManager().getDefaultDisplay().getMetrics(dm);
            float densityScale = dm.density;
            float scaledWidth = MDPI_PX * densityScale;
            float scaledHeight = MDPI_PX * densityScale;
            icon.setBounds(0,0,Math.round(scaledWidth),Math.round(scaledHeight));

            view.setText(label);
            view.setCompoundDrawablePadding((int) getResources().getDimension(R.dimen.icon_margin));
            view.setCompoundDrawables(icon, null, null, null);

            return view;
        }
    }

    private static final HashSet<CopyHandler> KNOWN_COPY_HANDLERS = new HashSet<CopyHandler>();

    static {
        if (KNOWN_COPY_HANDLERS.isEmpty()) {

            KNOWN_COPY_HANDLERS.add(new CopyHandler(
                    "com.google.android.apps.docs",
                    "com.google.android.apps.docs.app.SendTextToClipboardActivity"));

            KNOWN_COPY_HANDLERS.add(new CopyHandler(
                    "com.aokp.romcontrol",
                    "com.aokp.romcontrol.ShareToClipboard"));
        }
    }

    private HashMap<ComponentName, Intent> mActivities = new HashMap<ComponentName, Intent>();

    private IntentAdapter mAdapter;
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
        mPackageManager = getContext().getPackageManager();
        mAdapter = new IntentAdapter();
        setAdapter(mAdapter);
    }

    public ResolveInfo getItem(int position) {
        return mAdapter.getItem(position);
    }

    public Intent getTargetIntent(int position) {
        ActivityInfo activity = mAdapter.getItem(position).activityInfo;

        ComponentName activityId = new ComponentName(activity.packageName, activity.name);

        Intent intentType = mActivities.get(activityId);

        Intent intent = new Intent(intentType)
                .setComponent(activityId)
                .setPackage(activity.packageName);

        return intent;
    }

    // wrapper method for single intents
    public void setIntent(Intent intent) {
        ArrayList<Intent> intentList = new ArrayList<Intent>(1);
        intentList.add(intent);
        setIntents(intentList);
    }

    public void setIntents(ArrayList<Intent> intents) {
        mAdapter.setNotifyOnChange(false);
        mAdapter.clear();

        String packageName = getContext().getPackageName();

        ArrayList<ResolveInfo> allActivities = new ArrayList<ResolveInfo>();

        for (Intent intent : intents) {
            List<ResolveInfo> activityList = mPackageManager.queryIntentActivities(intent, 0);

            ResolveInfo defaultTarget = mPackageManager.resolveActivity(intent, 0);

            boolean hasCopyIntent = false;
            for (ResolveInfo resolveInfo : activityList) { // search for "Copy to clipboard" handler
                CopyHandler handler = new CopyHandler(resolveInfo);

                if (KNOWN_COPY_HANDLERS.contains(handler)) {
                    hasCopyIntent = true;
                }
            }

            // use traditional loop since list may change during iteration
            for (int i = 0; i < activityList.size(); i++) {
                ResolveInfo info = activityList.get(i);
                ActivityInfo activity = info.activityInfo;

                // fix bug in PackageManager - a replaced package name might cause non-exported intents to appear
                if (!activity.exported && !activity.packageName.equals(packageName)) {
                    activityList.remove(i);
                    i--;
                    continue;
                }

                // remove all IITCm intents, except for SendToClipboard in case Drive is not installed
                if (activity.packageName.equals(packageName)) {
                    if (hasCopyIntent || !activity.name.equals(SendToClipboard.class.getCanonicalName())) {
                        activityList.remove(i);
                        i--;
                        continue;
                    }
                }
            }

            // add to activity hash map if they doesn't exist
            for (ResolveInfo resolveInfo : activityList) {

                ActivityInfo activity = resolveInfo.activityInfo;
                ComponentName activityId = new ComponentName(activity.packageName, activity.name);

                if (!mActivities.containsKey(activityId)) {
                    mActivities.put(activityId, intent);
                    // move default Intent to top
                    if (resolveInfo.activityInfo.packageName.equals(defaultTarget.activityInfo.packageName)
                            && resolveInfo.activityInfo.name.equals(defaultTarget.activityInfo.name)) {
                        allActivities.add(0, resolveInfo);
                    } else {
                        allActivities.add(resolveInfo);
                    }
                }

            }
        }

        Collections.sort(allActivities, ((ShareActivity) getContext()).getIntentComparator());

        mAdapter.addAll(allActivities);
        mAdapter.setNotifyOnChange(true);
        mAdapter.notifyDataSetChanged();
    }
}
