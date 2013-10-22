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
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.cradle.iitc_mobile.R;

public class MainSettings extends PreferenceFragment {

    private String mIitcVersion;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mIitcVersion = getArguments().getString("iitc_version");

        addPreferencesFromResource(R.xml.preferences);

        // set build version
        ListPreference pref_build_version = (ListPreference) findPreference("pref_build_version");
        PackageManager pm = getActivity().getPackageManager();
        String version = "unknown";
        try {
            PackageInfo info = pm.getPackageInfo(
                    getActivity().getPackageName(), 0);
            version = info.versionName;
        } catch (NameNotFoundException e) {
            e.printStackTrace();
        }
        pref_build_version.setSummary(version);

        // set iitc version
        ListPreference pref_iitc_version = (ListPreference) findPreference("pref_iitc_version");
        pref_iitc_version.setSummary(mIitcVersion);

        // set iitc source
        EditTextPreference pref_iitc_source = (EditTextPreference) findPreference("pref_iitc_source");
        pref_iitc_source
                .setOnPreferenceChangeListener(new OnPreferenceChangeListener() {
                    @Override
                    public boolean onPreferenceChange(Preference preference,
                                                      Object newValue) {
                        preference.setSummary(getString(R.string.pref_select_iitc_sum) +
                                " " + newValue);
                        // TODO: update mIitcVersion when iitc source has
                        // changed
                        return true;
                    }
                });
        // first init of summary
        String pref_iitc_source_sum = getString(R.string.pref_select_iitc_sum)
                + " " + pref_iitc_source.getText();
        pref_iitc_source.setSummary(pref_iitc_source_sum);
    }

    // we want a home button + HomeAsUpEnabled in nested preferences
    // for some odd reasons android is not able to do this by default
    // so we need some additional hacks...
    // thx to http://stackoverflow.com/a/16800527/2638486 !!
    @Override
    public boolean onPreferenceTreeClick(PreferenceScreen preferenceScreen, Preference preference) {
        if (preference.getTitle().toString().equals(getString(R.string.pref_advanced_options))) {
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
            dialog.getActionBar().setDisplayHomeAsUpEnabled(true);

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
