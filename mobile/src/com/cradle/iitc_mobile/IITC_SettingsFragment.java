package com.cradle.iitc_mobile;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Bundle;
import android.preference.ListPreference;
import android.preference.PreferenceFragment;

public class IITC_SettingsFragment extends PreferenceFragment {
	
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        addPreferencesFromResource(R.xml.preferences);
        
        // set build version
        ListPreference pref_build_version = (ListPreference) findPreference("pref_build_version");
        PackageManager pm = getActivity().getPackageManager();
        String version = "unknown";
        try {
            PackageInfo info = pm.getPackageInfo(getActivity().getPackageName(), 0);
            version = info.versionName;
        }
        catch (NameNotFoundException e) {
        }
        pref_build_version.setSummary(version);
    }
}
