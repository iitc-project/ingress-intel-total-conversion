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
import java.util.HashMap;

public class UpdateScript extends AsyncTask<String, Void, Boolean> {

    private final Activity mActivity;
    private String mFilePath;
    private String mScript;
    private HashMap<String, String> mScriptInfo;

    public UpdateScript(final Activity activity) {
        mActivity = activity;
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        try {
            mFilePath = urls[0];
            // get local script meta information
            mScript = IITC_FileManager.readStream(new FileInputStream(new File(mFilePath)));
            mScriptInfo = IITC_FileManager.getScriptInfo(mScript);
            String updateURL = mScriptInfo.get("updateURL");
            final String downloadURL = mScriptInfo.get("downloadURL");
            if (updateURL == null) updateURL = downloadURL;

            // check for https protocol
            final URL url = new URL(updateURL);
            SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mActivity);
            Boolean secureUpdates = prefs.getBoolean("pref_secure_updates", true);
            if (!url.getProtocol().equals("https") && secureUpdates) return false;

            // get remote script meta information
            final InputStream is = url.openStream();
            final String remote_version = IITC_FileManager.getScriptInfo(IITC_FileManager.readStream(is)).get("version");
            final File local_file = new File(mFilePath);
            final String local_version = mScriptInfo.get("version");

            // update script if neccessary
            if (local_version.compareTo(remote_version) < 0) {
                Log.d("plugin " + mFilePath + " outdated\n" + local_version + " vs " + remote_version);
                Log.d("updating file....");
                IITC_FileManager.copyStream(new URL(downloadURL).openStream(), new FileOutputStream(local_file), true);
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
