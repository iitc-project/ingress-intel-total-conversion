package com.cradle.iitc_mobile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Scanner;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.MenuItem;

public class IITC_Settings extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        IITC_SettingsFragment settings = new IITC_SettingsFragment();

        AssetManager am = this.getAssets();
        String[] asset_array = null;
        try {
            asset_array = am.list("plugins");
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        // set action bar title
        this.getActionBar().setTitle("IITC Mobile Settings");
        this.getActionBar().setHomeButtonEnabled(true);

        ArrayList<String> asset_list = new ArrayList<String>();
        ArrayList<String> asset_values = new ArrayList<String>();

        for (int i = 0; i < asset_array.length; i++) {
            // find user plugin name for user readable entries
            Scanner s = null;
            String src = "";
            try {
                s = new Scanner(am.open("plugins/" + asset_array[i]))
                        .useDelimiter("\\A");
            } catch (IOException e2) {
                // TODO Auto-generated catch block
                e2.printStackTrace();
            }
            if (s != null)
                src = s.hasNext() ? s.next() : "";
            String plugin_name = getPluginName(src);
            asset_list.add(plugin_name);
            // real value
            asset_values.add(asset_array[i]);
        }

        // load additional plugins from <storage-path>/IITC_Mobile/plugins/
        String iitc_path = Environment.getExternalStorageDirectory().getPath()
                + "/IITC_Mobile/";
        File directory = new File(iitc_path + "plugins/");
        File[] files = directory.listFiles();
        if (files != null) {
            Scanner s = null;
            String src = "";
            for (int i = 0; i < files.length; ++i) {
                try {
                    s = new Scanner(files[i]).useDelimiter("\\A");
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                    Log.d("iitcm", "failed to parse file " + files[i]);
                }
                if (s != null)
                    src = s.hasNext() ? s.next() : "";
                String plugin_name = getPluginName(src);
                asset_list.add("[User] " + plugin_name);
                // real value
                asset_values.add(files[i].toString());
            }
        }

        Bundle bundle = getIntent().getExtras();
        bundle.putStringArray("ASSETS",
                (String[]) asset_list.toArray(new String[0]));
        bundle.putStringArray("ASSETS_VAL",
                (String[]) asset_values.toArray(new String[0]));
        settings.setArguments(bundle);

        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, settings).commit();
    }

    // parse header for @name of plugin
    public String getPluginName(String src) {
        String header = src.substring(src.indexOf("==UserScript=="),
                src.indexOf("==/UserScript=="));
        // remove new line comments and replace with space
        // this way we get double spaces instead of newline + double slash
        header = header.replace("\n//", " ");
        // get a list of key-value...split on multiple spaces
        String[] attributes = header.split("  +");
        String plugin_name = "not found";
        for (int j = 0; j < attributes.length; j++) {
            // search for name and use the value
            if (attributes[j].equals("@name"))
                plugin_name = attributes[j + 1];
        }
        return plugin_name;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            // exit settings when home button (iitc icon) is pressed
            case android.R.id.home :
                this.finish();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }
}