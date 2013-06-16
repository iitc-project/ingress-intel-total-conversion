package com.cradle.iitc_mobile;

import android.app.Activity;
import android.os.Bundle;
import android.view.MenuItem;

public class IITC_Settings extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        IITC_SettingsFragment settings = new IITC_SettingsFragment();

        // set action bar title
        getActionBar().setTitle("IITC Mobile Settings");
        getActionBar().setHomeButtonEnabled(true);

        // iitc version
        Bundle bundle = getIntent().getExtras();
        settings.setArguments(bundle);

        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, settings).commit();
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
}