package com.cradle.iitc_mobile.fragments;

import android.app.ActionBar;
import android.os.Bundle;
import android.preference.PreferenceFragment;

import com.cradle.iitc_mobile.IITC_PluginPreference;
import com.cradle.iitc_mobile.IITC_PluginPreferenceActivity;
import com.cradle.iitc_mobile.R;

import java.util.ArrayList;

public class PluginsFragment extends PreferenceFragment {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // just a dummy to get the preferenceScreen
        addPreferencesFromResource(R.xml.pluginspreference);

        // alphabetical order
        getPreferenceScreen().setOrderingAsAdded(false);

        if (getArguments() != null) {
            // get plugins category for this fragments and plugins list
            String category = getArguments().getString("category");
            boolean userPlugin = getArguments().getBoolean("userPlugin");
            ArrayList<IITC_PluginPreference> prefs =
                    IITC_PluginPreferenceActivity.getPluginPreference(category, userPlugin);

            // add plugin checkbox preferences
            for (IITC_PluginPreference pref : prefs) {
                getPreferenceScreen().addPreference(pref);
            }

            // set action bar stuff
            ActionBar bar = getActivity().getActionBar();
            bar.setTitle("IITC Plugins: " + category);
            bar.setDisplayHomeAsUpEnabled(true);
        }
    }

}
