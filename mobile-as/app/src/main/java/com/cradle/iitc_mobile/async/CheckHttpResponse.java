package com.cradle.iitc_mobile.async;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_Mobile;
import com.cradle.iitc_mobile.Log;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import java.io.IOException;

/*
 * this class parses the http response of a web page.
 * since network operations shouldn't be done on main UI thread
 * (NetworkOnMainThread exception is thrown) we use an async task for this.
 */
public class CheckHttpResponse extends AsyncTask<String, Void, Boolean> {

    private final IITC_Mobile mIitc;

    public CheckHttpResponse(final IITC_Mobile iitc) {
        mIitc = iitc;
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        // check http responses and disable splash screen on error
        HttpGet httpRequest = null;
        try {
            httpRequest = new HttpGet(urls[0]);
        } catch (final IllegalArgumentException e) {
            Log.w(e);
            return false;
        }
        final HttpClient httpclient = new DefaultHttpClient();
        HttpResponse response = null;
        try {
            response = httpclient.execute(httpRequest);
            final int code = response.getStatusLine().getStatusCode();
            if (code != HttpStatus.SC_OK) {
                Log.d("received error code: " + code);
                mIitc.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mIitc.setLoadingState(false);
                    }
                });
                // TODO: remove when google login issue is fixed
                if (urls[0].contains("uberauth=WILL_NOT_SIGN_IN")) { return true; }
            }
        } catch (final IOException e) {
            Log.w(e);
        }
        return false;
    }

    /*
     * TEMPORARY WORKAROUND for Google login fail
     */
    @Override
    protected void onPostExecute(final Boolean aBoolean) {
        if (aBoolean) {
            Log.d("google auth error, redirecting to work-around page");
            final AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(mIitc);

            // set title
            alertDialogBuilder.setTitle("LOGIN FAILED!");

            // set dialog message
            alertDialogBuilder
                    .setMessage("This is caused by Google and hopefully fixed soon. " +
                            "To workaround this issue:\n" +
                            "• Choose 'Cancel' when asked to choose an account " +
                            "and manually enter your email address and password into the web page\n" +
                            "• If you don't see the account chooser, delete apps cache/data " +
                            "to force a new login session and handle it as described above")
                    .setCancelable(true)
                    .setNeutralButton("Reload now", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(final DialogInterface dialog, final int which) {
                            dialog.cancel();
                            mIitc.reloadIITC();
                        }
                    });

            // create alert dialog
            final AlertDialog alertDialog = alertDialogBuilder.create();

            // show it
            alertDialog.show();
        }
    }
}
