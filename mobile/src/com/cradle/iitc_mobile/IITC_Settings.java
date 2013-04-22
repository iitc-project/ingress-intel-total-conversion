package com.cradle.iitc_mobile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;

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

        ArrayList<String> asset_list = new ArrayList<String>(Arrays.asList(asset_array));
        ArrayList<String> asset_values = new ArrayList<String>();

        for (int i = 0; i < asset_list.size();) {
            try {
                if (asset_list.get(i).endsWith("user.js")) {
                    asset_values.add(am.open("plugins/" + asset_list.get(i)).toString());
                    i++;
                }
                else {
                    asset_list.remove(i);
                    asset_values.add(am.open("plugins/" + asset_list.get(i)).toString());
                }
            } catch (IOException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        Bundle bundle = getIntent().getExtras();
        bundle.putStringArray("ASSETS", (String[]) asset_list.toArray(new String[0]));
        bundle.putStringArray("ASSETS_VAL", (String[]) asset_values.toArray(new String[0]));
        settings.setArguments(bundle);

        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, settings)
                .commit();
    }
}