package com.cradle.iitc_mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.text.Html;
import android.text.method.LinkMovementMethod;
import android.view.View;
import android.widget.CheckBox;
import android.widget.TextView;

public class IITC_NotificationHelper {

    public static final int NOTICE_HOWTO = 1 << 0;
    public static final int NOTICE_INFO = 1 << 1;
    public static final int NOTICE_PANES = 1 << 2;
    public static final int NOTICE_EXTPLUGINS = 1 << 3;
    public static final int NOTICE_SHARING = 1 << 4;
    // next one would be 1<<5; (this results in 1,2,4,8,...)

    private final Activity mActivity;
    private final SharedPreferences mPrefs;
    private int mDialogs = 0;

    public IITC_NotificationHelper(final Activity activity) {
        mActivity = activity;
        mPrefs = PreferenceManager.getDefaultSharedPreferences(mActivity);
    }

    public void showNotice(final int which) {
        if ((mPrefs.getInt("pref_messages", 0) & which) != 0 || (mDialogs & which) != 0) return;

        String text;
        switch (which) {
            case NOTICE_HOWTO:
                text = mActivity.getString(R.string.notice_how_to);
                break;
            case NOTICE_INFO:
                text = mActivity.getString(R.string.notice_info);
                break;
            case NOTICE_PANES:
                text = mActivity.getString(R.string.notice_panes);
                break;
            case NOTICE_EXTPLUGINS:
                text = mActivity.getString(R.string.notice_extplugins);
                text = String.format(text, Environment.getExternalStorageDirectory().getPath()
                        + "/IITC_Mobile/plugins/");
                break;
            case NOTICE_SHARING:
                text = mActivity.getString(R.string.notice_sharing);
                break;
            default:
                return;
        }

        final View content = mActivity.getLayoutInflater().inflate(R.layout.dialog_notice, null);
        final TextView message = (TextView) content.findViewById(R.id.tv_notice);
        message.setText(Html.fromHtml(text));
        message.setMovementMethod(LinkMovementMethod.getInstance());

        final AlertDialog dialog = new AlertDialog.Builder(mActivity)
                .setView(content)
                .setCancelable(true)
                .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(final DialogInterface dialog, final int which) {
                        dialog.cancel();
                    }
                })
                .create();
        dialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
            @Override
            public void onDismiss(final DialogInterface dialog) {
                mDialogs &= ~which;
                if (((CheckBox) content.findViewById(R.id.cb_do_not_show_again)).isChecked()) {
                    int value = mPrefs.getInt("pref_messages", 0);
                    value |= which;

                    mPrefs
                            .edit()
                            .putInt("pref_messages", value)
                            .commit();
                }
            }
        });

        mDialogs |= which;
        dialog.show();
    }
}
