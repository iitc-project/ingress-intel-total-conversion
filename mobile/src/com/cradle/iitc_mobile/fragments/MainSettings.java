package com.cradle.iitc_mobile.fragments;

import android.app.Dialog;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Bundle;
import android.preference.EditTextPreference;
import android.preference.ListPreference;
import android.preference.Preference;
import android.preference.Preference.OnPreferenceChangeListener;
import android.preference.PreferenceFragment;
import android.preference.PreferenceScreen;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.cradle.iitc_mobile.IITC_AboutDialogPreference;
import com.cradle.iitc_mobile.Log;
import com.cradle.iitc_mobile.R;

public class MainSettings extends PreferenceFragment {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        addPreferencesFromResource(R.xml.preferences);

        // set versions
        String iitcVersion = getArguments().getString("iitc_version");

        String buildVersion = "unknown";

        PackageManager pm = getActivity().getPackageManager();
        try {
            PackageInfo info = pm.getPackageInfo(getActivity().getPackageName(), 0);
            buildVersion = info.versionName;
        } catch (NameNotFoundException e) {
            Log.w(e);
        }

        IITC_AboutDialogPreference pref_about = (IITC_AboutDialogPreference) findPreference("pref_about");
        pref_about.setVersions(iitcVersion, buildVersion);

        final ListPreference pref_user_location_mode = (ListPreference) findPreference("pref_user_location_mode");
        pref_user_location_mode.setOnPreferenceChangeListener(new OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object newValue) {
                int mode = Integer.parseInt((String) newValue);
                preference.setSummary(getResources().getStringArray(R.array.pref_user_location_titles)[mode]);
                return true;
            }
        });

        String value = getPreferenceManager().getSharedPreferences().getString("pref_user_location_mode", "0");
        int mode = Integer.parseInt(value);
        pref_user_location_mode.setSummary(getResources().getStringArray(R.array.pref_user_location_titles)[mode]);
    }

    // we want a home button + HomeAsUpEnabled in nested preferences
    // for some odd reasons android is not able to do this by default
    // so we need some additional hacks...
    // thx to http://stackoverflow.com/a/16800527/2638486 !!
    @Override
    public boolean onPreferenceTreeClick(PreferenceScreen preferenceScreen, Preference preference) {
        if (preference.getTitle().toString().equals(getString(R.string.pref_advanced_options))
                || preference.getTitle().toString().equals(getString(R.string.pref_about_title))) {
            initializeActionBar((PreferenceScreen) preference);
        }
        return super.onPreferenceTreeClick(preferenceScreen, preference);
    }

    // Apply custom home button area click listener to close the PreferenceScreen
    // because PreferenceScreens are dialogs which swallow
    // events instead of passing to the activity
    // Related Issue: https://code.google.com/p/android/issues/detail?id=4611
    public static void initializeActionBar(PreferenceScreen preferenceScreen) {
        final Dialog dialog = preferenceScreen.getDialog();

        if (dialog != null) {
            if (dialog.getActionBar() != null) dialog.getActionBar().setDisplayHomeAsUpEnabled(true);

            View homeBtn = dialog.findViewById(android.R.id.home);

            if (homeBtn != null) {
                View.OnClickListener dismissDialogClickListener = new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        dialog.dismiss();
                    }
                };

                ViewParent homeBtnContainer = homeBtn.getParent();

                // The home button is an ImageView inside a FrameLayout
                if (homeBtnContainer instanceof FrameLayout) {
                    ViewGroup containerParent = (ViewGroup) homeBtnContainer.getParent();

                    if (containerParent instanceof LinearLayout) {
                        // This view also contains the title text, set the whole view as clickable
                        ((LinearLayout) containerParent).setOnClickListener(dismissDialogClickListener);
                    } else {
                        // Just set it on the home button
                        ((FrameLayout) homeBtnContainer).setOnClickListener(dismissDialogClickListener);
                    }
                } else {
                    homeBtn.setOnClickListener(dismissDialogClickListener);
                }
            }
        }
    }
}
