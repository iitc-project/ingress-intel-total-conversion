package com.cradle.iitc_mobile;

import android.app.Activity;
import android.os.Bundle;

public class IITC_Settings extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        IITC_SettingsFragment settings = new IITC_SettingsFragment();
        settings.setArguments(getIntent().getExtras());

        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, settings)
                .commit();
    }
}