package com.cradle.iitc_mobile.async;

import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_Mobile;

import java.io.IOException;
import java.net.URL;
import java.util.Scanner;

/*
 * this class parses the content of a web page.
 * since network operations shouldn't be done on main UI thread
 * (NetworkOnMainThread exception is thrown) we use an async task for this.
 */
public class UrlContentToString extends AsyncTask<URL, Integer, String> {

    @Override
    protected String doInBackground(URL... urls) {
        String js = "";
        URL url = urls[0];
        try {
            js = new Scanner(url.openStream(), "UTF-8").useDelimiter("\\A")
                    .next();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return js;
    }

}
