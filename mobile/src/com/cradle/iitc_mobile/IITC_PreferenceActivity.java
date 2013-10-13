package com.cradle.iitc_mobile;

import android.app.Activity;
import android.os.Bundle;
import android.view.MenuItem;

import com.cradle.iitc_mobile.fragments.MainSettings;

public class IITC_PreferenceActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        MainSettings settings = new MainSettings();

        getActionBar().setHomeButtonEnabled(true);
        getActionBar().setDisplayHomeAsUpEnabled(true);

        // iitc version
        Bundle bundle = getIntent().getExtras();
        settings.setArguments(bundle);

        // Display the fragment as the main content.
        getFragmentManager()
                .beginTransaction()
                .replace(android.R.id.content, settings)
                .commit();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home: // exit settings when home button (iitc icon) is pressed
                onBackPressed();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }
}