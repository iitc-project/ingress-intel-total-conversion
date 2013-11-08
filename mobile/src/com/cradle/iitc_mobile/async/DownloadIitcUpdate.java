package com.cradle.iitc_mobile.async;

import android.app.ProgressDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.util.Log;

import com.cradle.iitc_mobile.IITC_Mobile;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;

/**
 * Background Async Task to download file
 * */
public class DownloadIitcUpdate extends AsyncTask<String, Integer, String> {

    private final IITC_Mobile mIitc;
    private final ProgressDialog mProgressDialog;

    public DownloadIitcUpdate(IITC_Mobile iitcm) {
        mIitc = iitcm;
        mProgressDialog = iitcm.getProgressDialog();
    }

    @Override
    protected void onPreExecute() {
        super.onPreExecute();
        mProgressDialog.show();
    }

    @Override
    protected String doInBackground(String... fileUrl) {
        int count;
        try {
            URL url = new URL(fileUrl[0]);
            URLConnection connection = url.openConnection();
            connection.connect();
            int lengthOfFile = connection.getContentLength();

            // input stream to read file - with 8k buffer
            InputStream input = new BufferedInputStream(url.openStream(), 8192);

            // Output stream to write file
            OutputStream output = new FileOutputStream(Environment.getExternalStorageDirectory().toString()
                    + "/iitc_update.apk");

            byte data[] = new byte[8192];

            long total = 0;

            while ((count = input.read(data)) != -1) {
                total += count;
                // publishing the progress....
                publishProgress((int)(total*100)/lengthOfFile);

                // writing data to file
                output.write(data, 0, count);
            }

            output.flush();

            // closing streams
            output.close();
            input.close();

        } catch (Exception e) {
            Log.e("iitcm:", e.getMessage());
        }

        return null;
    }

    protected void onProgressUpdate(Integer... progress) {
        super.onProgressUpdate(progress);
        // if we get here, length is known, now set indeterminate to false
        mProgressDialog.setIndeterminate(false);
        mProgressDialog.setMax(100);
        mProgressDialog.setProgress(progress[0]);
   }

    @Override
    protected void onPostExecute(String fileUrl) {
        // dismiss the dialog after the file was downloaded
        mProgressDialog.dismiss();

        String iitcPath = Environment.getExternalStorageDirectory().toString() + "/iitc_update.apk";
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.fromFile(new File(iitcPath)), "application/vnd.android.package-archive");
        mIitc.startActivityForResult(intent, mIitc.REQUEST_UPDATE_FINISHED);
    }
}