package com.cradle.iitc_mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.preference.Preference;
import android.preference.PreferenceManager;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;

import com.cradle.iitc_mobile.IITC_FileManager;
import com.cradle.iitc_mobile.IITC_Mobile;

/**
 * The OptionDialogPreference will display a dialog, and will persist the
 * <code>true</code> when pressing the positive button and <code>false</code>
 * otherwise. It will persist to the android:key specified in xml-preference.
 */
public class IITC_ForceUpdatePreference extends Preference {

    public IITC_ForceUpdatePreference(Context context, AttributeSet attrs) {
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