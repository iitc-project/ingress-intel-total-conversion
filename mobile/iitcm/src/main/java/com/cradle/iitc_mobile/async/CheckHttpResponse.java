package com.cradle.iitc_mobile.async;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_Mobile;
import com.cradle.iitc_mobile.Log;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/*
 * this class parses the http response of a web page.
 * since network operations shouldn't be done on main UI thread
 * (NetworkOnMainThread exception is thrown) we use an async task for this.
 */
public class CheckHttpResponse extends AsyncTask<String, Void, Boolean> {

    private final IITC_Mobile mIitc;
    private final OkHttpClient client;

    public CheckHttpResponse(final IITC_Mobile iitc) {
        mIitc = iitc;
        client = new OkHttpClient();
    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        // check http responses and disable splash screen on error
        Response response = null;
        try {
            response = client.newCall(
                    new Request.Builder()
                            .url(urls[0])
                            .get()
                            .build()
            ).execute();
            final int code = response.code();
            if (code != 200) {
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
        } finally {
            if (response != null && response.body() != null) {
                response.body().close();
            }
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
