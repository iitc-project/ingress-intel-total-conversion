package com.cradle.iitc_mobile.fragments;

import android.app.ActionBar;
import android.os.Bundle;
import android.preference.PreferenceFragment;

import com.cradle.iitc_mobile.IITC_PluginPreference;
import com.cradle.iitc_mobile.R;

import java.util.ArrayList;

public class PluginsFragment extends PreferenceFragment {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        addPreferencesFromResource(R.xml.pluginspreference);

        // alphabetical order
        getPreferenceScreen().setOrderingAsAdded(false);

        // add plugin checkboxes
        ArrayList<String> ids = getArguments().getStringArrayList("ids");
        for (String id : ids) {
            String title = getArguments().getStringArrayList(id).get(0);
            String desc = getArguments().getStringArrayList(id).get(1);
            IITC_PluginPreference plugin_pref = new IITC_PluginPreference(getActivity());
            plugin_pref.setKey(id);
            plugin_pref.setTitle(title);
            plugin_pref.setSummary(desc);
            plugin_pref.setDefaultValue(false);
            plugin_pref.setPersistent(true);
            getPreferenceScreen().addPreference(plugin_pref);
        }

        ActionBar bar = getActivity().getActionBar();
        String actionBarTitle = getArguments().getString("title");
        bar.setTitle("IITC Plugins: " + actionBarTitle);
        bar.setDisplayHomeAsUpEnabled(true);
        getActivity().getActionBar().setDisplayHomeAsUpEnabled(true);
    }

}
