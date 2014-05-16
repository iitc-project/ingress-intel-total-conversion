package com.cradle.iitc_mobile.prefs;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.preference.Preference;
import android.preference.PreferenceManager;
import android.util.AttributeSet;

import com.cradle.iitc_mobile.R;

/**
 * The OptionDialogPreference will display a dialog, and will persist the
 * <code>true</code> when pressing the positive button and <code>false</code>
 * otherwise. It will persist to the android:key specified in xml-preference.
 */
public class ForceUpdatePreference extends Preference {

    public ForceUpdatePreference(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onClick() {
        super.onClick();
        new AlertDialog.Builder(getContext())
                .setTitle(R.string.pref_force_plugin_update)
                .setMessage(R.string.pref_force_plugin_update_sum)
                .setCancelable(true)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        PreferenceManager.getDefaultSharedPreferences(getContext())
                                .edit()
                                .putLong("pref_last_plugin_update", 0)
                                .commit();
                        dialog.cancel();
                    }
                })
                .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.cancel();
                    }
                })
                .create()
                .show();
    }
}