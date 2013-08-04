package com.cradle.iitc_mobile;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.os.Environment;
import android.preference.EditTextPreference;
import android.preference.ListPreference;
import android.preference.Preference;
import android.preference.Preference.OnPreferenceChangeListener;
import android.preference.PreferenceFragment;
import android.preference.PreferenceScreen;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Scanner;

public class IITC_SettingsFragment extends PreferenceFragment {

    private String mIitcVersion;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mIitcVersion = getArguments().getString("iitc_version");

        addPreferencesFromResource(R.xml.preferences);

        // plugins
        setUpPluginPreferenceScreen();

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

    void setUpPluginPreferenceScreen() {
        PreferenceScreen root = (PreferenceScreen) findPreference("pref_plugins");
        // alphabetical order
        root.setOrderingAsAdded(false);
        root.setPersistent(true);

        // get all plugins from asset manager
        AssetManager am = this.getActivity().getAssets();
        String[] asset_array = null;
        try {
            asset_array = am.list("plugins");
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        for (String anAsset_array : asset_array) {
            // find user plugin name for user readable entries
            Scanner s = null;
            String src = "";
            try {
                s = new Scanner(am.open("plugins/" + anAsset_array))
                        .useDelimiter("\\A");
            } catch (IOException e2) {
                // TODO Auto-generated catch block
                e2.printStackTrace();
            }
            if (s != null)
                src = s.hasNext() ? s.next() : "";
            // now we have all stuff together and can build the pref screen
            addPluginPreference(root, src, anAsset_array, false);
        }

        // load additional plugins from <storage-path>/IITC_Mobile/plugins/
        String iitc_path = Environment.getExternalStorageDirectory().getPath()
                + "/IITC_Mobile/";
        File directory = new File(iitc_path + "plugins/");
        File[] files = directory.listFiles();
        if (files != null) {
            Scanner s = null;
            String src = "";
            for (File file : files) {
                try {
                    s = new Scanner(file).useDelimiter("\\A");
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                    Log.d("iitcm", "failed to parse file " + file);
                }
                if (s != null)
                    src = s.hasNext() ? s.next() : "";

                // now we have all stuff together and can build the pref screen
                addPluginPreference(root, src, file.toString(), true);
            }
        }
    }

    void addPluginPreference(PreferenceScreen root, String src, String plugin_key,
                             boolean additional) {

        // now parse plugin name, description and category
        String header = src.substring(src.indexOf("==UserScript=="),
                src.indexOf("==/UserScript=="));
        // remove new line comments and replace with space
        // this way we get double spaces instead of newline + double slash
        header = header.replace("\n//", " ");
        // get a list of key-value...split on multiple spaces
        String[] attributes = header.split("  +");
        String plugin_name = "not found";
        String plugin_desc = "not found";
        String plugin_cat = "Misc";
        for (int j = 0; j < attributes.length; j++) {
            // search for name and use the value
            if (attributes[j].equals("@name"))
                plugin_name = attributes[j + 1];
            if (attributes[j].equals("@description"))
                plugin_desc = attributes[j + 1];
            if (attributes[j].equals("@category"))
                plugin_cat = attributes[j + 1];
        }

        // remove IITC plugin prefix from plugin_name
        plugin_name = plugin_name.replace("IITC Plugin: ", "");
        plugin_name = plugin_name.replace("IITC plugin: ", "");

        // add [User] tag to additional plugins
        if (additional)
            plugin_cat = "[User] " + plugin_cat;
        // now we have all stuff together and can build the pref screen
        PreferenceScreen pref_screen;
        if (root.findPreference(plugin_cat) == null) {
            Log.d("iitcm", "create " + plugin_cat + " and add " + plugin_name);
            pref_screen = getPreferenceManager().createPreferenceScreen(root.getContext());
            pref_screen.setTitle(plugin_cat);
            pref_screen.setKey(plugin_cat);
            // alphabetical order
            pref_screen.setOrderingAsAdded(false);
            pref_screen.setPersistent(true);
            root.addPreference(pref_screen);
        } else {
            Log.d("iitcm", "add " + plugin_name + " to " + plugin_cat);
            pref_screen = (PreferenceScreen) findPreference(plugin_cat);
        }

        // now build a new checkable preference for the plugin
        IITC_PluginPreference plugin_pref = new IITC_PluginPreference(pref_screen.getContext());
        plugin_pref.setKey(plugin_key);
        plugin_pref.setTitle(plugin_name);
        plugin_pref.setSummary(plugin_desc);
        plugin_pref.setDefaultValue(false);
        plugin_pref.setPersistent(true);
        pref_screen.addPreference(plugin_pref);
    }
}
