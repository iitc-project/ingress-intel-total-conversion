package com.cradle.iitc_mobile.async;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.AsyncTask;
import android.util.Log;

import com.cradle.iitc_mobile.IITC_JSInterface;
import com.cradle.iitc_mobile.IITC_Mobile;

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

    private final IITC_JSInterface mJsInterface;
    private final Context mContext;

    public CheckHttpResponse(IITC_JSInterface jsInterface, Context c) {
        mContext = c;
        mJsInterface = jsInterface;
    }

    @Override
    protected Boolean doInBackground(String... urls) {
        // check http responses and disable splash screen on error
        HttpGet httpRequest = new HttpGet(urls[0]);
        HttpClient httpclient = new DefaultHttpClient();
        HttpResponse response = null;
        try {
            response = httpclient.execute(httpRequest);
            int code = response.getStatusLine().getStatusCode();
            if (code != HttpStatus.SC_OK) {
                Log.d("iitcm", "received error code: " + code);
                final IITC_Mobile iitc = (IITC_Mobile) mContext;
                iitc.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        iitc.setLoadingState(false);
                    }
                });
                // TODO: remove when google login issue is fixed
                if (urls[0].contains("uberauth=WILL_NOT_SIGN_IN")) {
                    return true;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
    }

    /*
     * TEMPORARY WORKAROUND for Google login fail
     */
    @Override
    protected void onPostExecute(Boolean aBoolean) {
        if (aBoolean) {
            Log.d("iitcm", "google auth error, redirecting to work-around page");
            AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(mContext);

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
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.cancel();
                            IITC_Mobile iitc_mobile = (IITC_Mobile) mContext;
                            iitc_mobile.reloadIITC();
                        }
                    });

            // create alert dialog
            AlertDialog alertDialog = alertDialogBuilder.create();

            // show it
            alertDialog.show();
        }
    }
}
