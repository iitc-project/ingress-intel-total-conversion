package com.cradle.iitc_mobile.async;

import android.os.AsyncTask;
import android.util.Log;

import com.cradle.iitc_mobile.IITC_JSInterface;

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
public class CheckHttpResponse extends AsyncTask<String, Void, Void> {

    private IITC_JSInterface mJsInterface;

    public CheckHttpResponse(IITC_JSInterface jsInterface) {
        mJsInterface = jsInterface;
    };

    @Override
    protected Void doInBackground(String... urls) {
        // check http responses and disable splash screen on error
        HttpGet httpRequest = new HttpGet(urls[0]);
        HttpClient httpclient = new DefaultHttpClient();
        HttpResponse response = null;
        try {
            response = httpclient.execute(httpRequest);
            int code = response.getStatusLine().getStatusCode();
            if (code != HttpStatus.SC_OK) {
                Log.d("iitcm", "received error code: " + code);
                mJsInterface.removeSplashScreen();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

}
