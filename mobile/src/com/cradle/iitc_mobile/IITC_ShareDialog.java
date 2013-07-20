package com.cradle.iitc_mobile;

import java.util.ArrayList;
import java.util.List;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DialogFragment;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ComponentInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;

public class IITC_ShareDialog extends DialogFragment {
    private abstract class Action {
        private int mIcon;
        private String mLabel;

        private Action(String label, int icon) {
            mLabel = label;
            mIcon = icon;
        }

        abstract void invoke();
    }

    public class OnClickListener implements DialogInterface.OnClickListener {
        @Override
        public void onClick(DialogInterface dialog, int which) {
            mAdapter.getItem(which).invoke();
        }
    }

    class ActionAdapter extends ArrayAdapter<Action> {
        private LayoutInflater mInflater;

        public ActionAdapter(Context context) {
            super(context, android.R.layout.simple_list_item_1, ACTIONS);
            mInflater = LayoutInflater.from(context);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            Action action = getItem(position);

            if (convertView == null)
                convertView = mInflater.inflate(android.R.layout.simple_list_item_1, null);

            TextView tv = (TextView) convertView;
            tv.setText(action.mLabel);
            tv.setCompoundDrawablePadding(8);
            tv.setCompoundDrawablesWithIntrinsicBounds(action.mIcon, 0, 0, 0);
            return convertView;
        }
    }

    private final Action[] ACTIONS = {
            new Action("Share…", R.drawable.ic_dialog_share) {
                void invoke() {
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);
                    intent.setType("text/plain");
                    intent.putExtra(Intent.EXTRA_TEXT, getUrl());
                    intent.putExtra(Intent.EXTRA_SUBJECT, mTitle);

                    startIntent(intent);
                }
            },
            new Action("View map with app…", R.drawable.location_map) {
                void invoke() {
                    String geoUri = "geo:" + mLl;
                    Intent intent = new Intent(android.content.Intent.ACTION_VIEW, Uri.parse(geoUri));

                    startIntent(intent);
                }
            },
            new Action("Open with browser…", R.drawable.ic_dialog_browser) {
                void invoke() {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(getUrl()));

                    startIntent(intent);
                }
            },
            new Action("Copy to clipboard", R.drawable.ic_dialog_copy) {
                void invoke() {
                    ClipData clip = ClipData.newPlainText("Copied text", getUrl());

                    ClipboardManager clipboard = (ClipboardManager) getActivity().getSystemService(
                            Activity.CLIPBOARD_SERVICE);
                    clipboard.setPrimaryClip(clip);

                    Toast.makeText(getActivity(), "copied to clipboard", Toast.LENGTH_SHORT).show();
                }
            }
    };

    private ActionAdapter mAdapter;
    private boolean mIsPortal = true;
    private String mLl;
    private String mTitle;
    private int mZoom;

    private String getUrl() {
        String url = "http://www.ingress.com/intel?ll=" + mLl + "&z=" + mZoom;
        if (mIsPortal)
            url += "&pll=" + mLl;
        return url;
    }

    private void startIntent(Intent intent) {
        // for geo: and Intel Map intents, the user may choose a default application to handle the intent. Since we have
        // suitable intent filters declared, it might be that we *are* the default application. In theses cases, a list
        // of designated applications is presented to the user

        String packageName = getActivity().getPackageName();

        PackageManager pm = getActivity().getPackageManager();
        ResolveInfo mInfo = pm.resolveActivity(intent, 0);

        if (mInfo.activityInfo.packageName.equals(packageName)) {
            // note: Intent.createChooser would be shorter, but it also includes IITCm.
            // Therefore, we'll filter the available activities
            String label = null;
            if (intent.getAction().equals(Intent.ACTION_SEND))
                label = "Share via";
            else if (intent.getAction().equals(Intent.ACTION_VIEW))
                label = "Open with";

            List<Intent> intents = new ArrayList<Intent>();
            List<ResolveInfo> activities = getActivity().getPackageManager().queryIntentActivities(intent, 0);

            if (!activities.isEmpty()) {
                for (ResolveInfo resolveInfo : activities) {
                    ComponentInfo info;
                    if (resolveInfo.activityInfo != null)
                        info = resolveInfo.activityInfo;
                    else
                        // Exactly one if these two must be non-null (according to docs)
                        info = resolveInfo.serviceInfo;

                    if (info.packageName.equals(packageName)) // don't show IITCm
                        continue;

                    // setComponent is used to route the intent towards the component
                    // setPackage is used to prevent Android from showing IITCm
                    // (without a package set, Android would still show all available components, including IITCm)
                    intents.add(new Intent(intent)
                            .setComponent(new ComponentName(info.packageName, info.name))
                            .setPackage(info.packageName));
                }

                intent = Intent.createChooser(intents.remove(intents.size() - 1), label);
                intent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.toArray(new Parcelable[] {}));
            }
        }

        startActivity(intent);
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        Bundle args = getArguments();
        mTitle = args.getString("title");
        mLl = args.getDouble("lat") + "," + args.getDouble("lng");
        mZoom = args.getInt("zoom");

        if (mTitle == null) {
            mTitle = "Intel Map";
            mIsPortal = false;
        }

        mAdapter = new ActionAdapter(getActivity());

        return new AlertDialog.Builder(getActivity())
                .setTitle(mTitle)
                .setAdapter(mAdapter, new OnClickListener())
                .create();
    }
}
