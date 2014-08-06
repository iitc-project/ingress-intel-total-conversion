package com.cradle.iitc_mobile.async;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
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
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;

public class UpdateScript extends AsyncTask<String, Void, Boolean> {

    private final Activity mActivity;
    private String mFilePath;
    private String mScript;
    private HashMap<String, String> mScriptInfo;
    private final boolean mForceSecureUpdates;

    public UpdateScript(final Activity activity) {
        mActivity = activity;
        mForceSecureUpdates = PreferenceManager.getDefaultSharedPreferences(mActivity)
                .getBoolean("pref_secure_updates", true);
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        try {
            mFilePath = urls[0];
            // get local script meta information
            mScript = IITC_FileManager.readStream(new FileInputStream(new File(mFilePath)));
            mScriptInfo = IITC_FileManager.getScriptInfo(mScript);

            String updateURL = mScriptInfo.get("updateURL");
            String downloadURL = mScriptInfo.get("downloadURL");
            if (updateURL == null) updateURL = downloadURL;

            if (!isUpdateAllowed(updateURL)) return false;

            final File updateFile = File.createTempFile("iitc.update", ".meta.js", mActivity.getCacheDir());
            IITC_FileManager.copyStream(new URL(updateURL).openStream(), new FileOutputStream(updateFile), true);

            final HashMap<String, String> updateInfo =
                    IITC_FileManager.getScriptInfo(IITC_FileManager.readFile(updateFile));

            final String remote_version = updateInfo.get("version");

            final File local_file = new File(mFilePath);
            final String local_version = mScriptInfo.get("version");

            if (local_version.compareTo(remote_version) >= 0) return false;

            Log.d("plugin " + mFilePath + " outdated\n" + local_version + " vs " + remote_version);

            InputStream sourceStream;
            if (updateURL.equals(downloadURL)) {
                sourceStream = new FileInputStream(updateFile);
            } else {
                if (updateInfo.get("downloadURL") != null) {
                    downloadURL = updateInfo.get("downloadURL");
                }

                if (!isUpdateAllowed(downloadURL)) return false;

                sourceStream = new URL(downloadURL).openStream();
            }

            Log.d("updating file....");
            IITC_FileManager.copyStream(sourceStream, new FileOutputStream(local_file), true);
            Log.d("...done");

            updateFile.delete();

            return true;

        } catch (final IOException e) {
            return false;
        }
    }

    private boolean isUpdateAllowed(final String url) throws MalformedURLException {
        if (new URL(url).getProtocol().equals("https"))
            return true;

        return !mForceSecureUpdates;
    }

    @Override
    protected void onPostExecute(final Boolean updated) {
        if (updated) {
            final String name = IITC_FileManager.getScriptInfo(mScript).get("name");
            new AlertDialog.Builder(mActivity)
                    .setTitle("Plugin updated")
                    .setMessage(name)
                    .setCancelable(true)
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(final DialogInterface dialog, final int which) {
                            dialog.cancel();
                        }
                    })
                    .setNegativeButton("Reload", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(final DialogInterface dialog, final int which) {
                            dialog.cancel();
                            ((IITC_Mobile) mActivity).reloadIITC();
                        }
                    })
                    .create()
                    .show();
        }
    }
}
