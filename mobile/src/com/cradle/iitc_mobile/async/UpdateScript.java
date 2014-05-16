package com.cradle.iitc_mobile.async;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.preference.PreferenceManager;

import com.cradle.iitc_mobile.IITC_FileManager;
import com.cradle.iitc_mobile.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

public class UpdateScript extends AsyncTask<String, Void, Boolean> {

    private final Activity mActivity;
    // update interval is 2 days
    private final long updateInterval = 1000*60*60*24*2;
    private String mFilePath;
    private String mScript;

    public UpdateScript(final Activity activity) {
        mActivity = activity;
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        try {
            mFilePath = urls[0];
            // check last script update
            final SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mActivity);
            final long lastUpdated = prefs.getLong(mFilePath + "-update", 0);
            final long now = System.currentTimeMillis();

            // return if no update wanted
            if (now - lastUpdated < updateInterval) return false;
            prefs
                    .edit()
                    .putLong(mFilePath + "-update", now)
                    .commit();

            // get local script meta information
            mScript = IITC_FileManager.readStream(new FileInputStream(new File(mFilePath)));
            final String updateURL = IITC_FileManager.getScriptInfo(mScript).get("updateURL");
            final String downloadURL = IITC_FileManager.getScriptInfo(mScript).get("downloadURL");

            // get remote script meta information
            final File file_old = new File(mFilePath);
            final InputStream is = new URL(updateURL).openStream();
            final String old_version = IITC_FileManager.getScriptInfo(mScript).get("version");
            final String new_version = IITC_FileManager.getScriptInfo(IITC_FileManager.readStream(is)).get("version");

            // update script if neccessary
            if (old_version.compareTo(new_version) < 0) {
                Log.d("plugin " + mFilePath + " outdated\n" + old_version + " vs " + new_version);
                Log.d("updating file....");
                IITC_FileManager.copyStream(new URL(downloadURL).openStream(), new FileOutputStream(file_old), true);
                Log.d("...done");
                return true;
            }
        } catch (final IOException e) {
            return false;
        }
        return false;
    }

    protected void onPostExecute(Boolean updated) {
        if (updated) {
            final String name = IITC_FileManager.getScriptInfo(mScript).get("name");
            new AlertDialog.Builder(mActivity)
                    .setTitle("Plugin updated")
                    .setMessage(name)
                    .setCancelable(true)
                    .setNeutralButton("OK", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.cancel();
                        }
                    })
                    .create()
                    .show();
        }
    }
}
