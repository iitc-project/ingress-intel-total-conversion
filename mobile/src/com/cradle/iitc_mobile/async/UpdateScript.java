package com.cradle.iitc_mobile.async;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.preference.PreferenceManager;

import com.cradle.iitc_mobile.IITC_FileManager;
import com.cradle.iitc_mobile.IITC_Mobile;
import com.cradle.iitc_mobile.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

public class UpdateScript extends AsyncTask<String, Void, Boolean> {

    private final Activity mActivity;
    private String mFilePath;
    private String mScript;

    public UpdateScript(final Activity activity) {
        mActivity = activity;
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        try {
            mFilePath = urls[0];
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
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.cancel();
                        }
                    })
                    .setNegativeButton("Reload", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.cancel();
                            ((IITC_Mobile) mActivity).reloadIITC();
                        }
                    })
                    .create()
                    .show();
        }
    }
}
