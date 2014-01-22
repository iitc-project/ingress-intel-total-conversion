package com.cradle.iitc_mobile.async;

import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_FileManager;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.net.URL;

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
            FileInputStream is = new FileInputStream(new File(url.getPath()));
            js = IITC_FileManager.readStream(is);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        return js;
    }

}
