package com.cradle.iitc_mobile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Scanner;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;

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

        ArrayList<String> asset_list = new ArrayList<String>();
        ArrayList<String> asset_values = new ArrayList<String>();

	    for (String anAsset_array : asset_array != null ? asset_array : new String[0]) {
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
		    asset_list.add(plugin_name);
		    // real value
		    asset_values.add(anAsset_array);
	    }

        Bundle bundle = getIntent().getExtras();
        bundle.putStringArray("ASSETS",
		                             asset_list.toArray(new String[asset_list.size()]));
        bundle.putStringArray("ASSETS_VAL",
		                             asset_values.toArray(new String[asset_values.size()]));
        settings.setArguments(bundle);

        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, settings).commit();
    }
}