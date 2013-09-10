package com.cradle.iitc_mobile;

import android.app.ActionBar;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.os.Environment;
import android.preference.PreferenceActivity;
import android.util.Log;
import android.view.MenuItem;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;

public class IITC_PluginPreferenceActivity extends PreferenceActivity {

    private List<Header> mHeaders;
    // we use a tree map to have a map with alphabetical order
    private static TreeMap<String, ArrayList<IITC_PluginPreference>> sPlugins = null;

    @Override
    public void onBuildHeaders(List<Header> target) {
        ActionBar bar = getActionBar();
        bar.setTitle("IITC Plugins");
        bar.setDisplayHomeAsUpEnabled(true);
        mHeaders = target;
        // since the plugins container is static,
        // it is enough to parse the plugin only on first start.
        if (sPlugins == null) {
            Log.d("iitcm", "opened plugin prefs the first time since app start -> parse plugins");
            sPlugins = new TreeMap<String, ArrayList<IITC_PluginPreference>>();
            setUpPluginPreferenceScreen();
        }
        addHeaders();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            // exit settings when home button (iitc icon) is pressed
            case android.R.id.home:
                onBackPressed();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    // called by Plugins Fragment
    public static ArrayList<IITC_PluginPreference> getPluginPreference(String key) {
        return sPlugins.get(key);
    }

    void setUpPluginPreferenceScreen() {

        // get all plugins from asset manager
        AssetManager am = getAssets();
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
            addPluginPreference(src, anAsset_array, false);
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
                addPluginPreference(src, file.toString(), true);
            }
        }
    }

    void addPluginPreference(String src, String plugin_key,
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

        // now we have all stuff together and can build the preference
        // first check if we need a new category
        if (sPlugins.containsKey(plugin_cat) == false) {
            sPlugins.put(plugin_cat, new ArrayList<IITC_PluginPreference>());
            Log.d("iitcm", "create " + plugin_cat + " and add " + plugin_name);
        }

        // now build a new checkable preference for the plugin
        IITC_PluginPreference plugin_pref = new IITC_PluginPreference(this);
        plugin_pref.setKey(plugin_key);
        plugin_pref.setTitle(plugin_name);
        plugin_pref.setSummary(plugin_desc);
        plugin_pref.setDefaultValue(false);
        plugin_pref.setPersistent(true);
        ArrayList<IITC_PluginPreference> list = sPlugins.get(plugin_cat);
        list.add(plugin_pref);
    }

    void addHeaders() {
        // every fragment handles 1 plugin category
        // push the category to the fragment and add the header to the list
        for (Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sPlugins.entrySet()) {
            Bundle bundle = new Bundle();
            String plugin_cat = entry.getKey();
            bundle.putString("category", plugin_cat);
            Header newHeader = new Header();
            newHeader.title = plugin_cat;
            newHeader.fragmentArguments = bundle;
            newHeader.fragment = "com.cradle.iitc_mobile.fragments.PluginsFragment";
            mHeaders.add(newHeader);
        }
    }
}
