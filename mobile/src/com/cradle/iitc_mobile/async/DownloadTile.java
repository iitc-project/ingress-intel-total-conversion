package com.cradle.iitc_mobile.async;

import android.app.AlertDialog;
import android.os.AsyncTask;
import android.util.Log;

import com.cradle.iitc_mobile.IITC_Mobile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

/*
 * this class parses the http response of a web page.
 * since network operations shouldn't be done on main UI thread
 * (NetworkOnMainThread exception is thrown) we use an async task for this.
 */
public class DownloadTile extends AsyncTask<String, Void, Boolean> {

    private String mFilePath;
    private String mFileName;

    public DownloadTile(String path, String fileName) {
        mFilePath = path;
        mFileName = fileName;

    }

    @Override
    protected Boolean doInBackground(String... urls) {
        URL tileUrl = null;
        URLConnection conn = null;
        try {
            tileUrl = new URL(urls[0]);
            conn = tileUrl.openConnection();
            InputStream is = null;
            is = conn.getInputStream();
            File file = new File(mFilePath, mFileName);
            Log.d("iitcm", "writing to file: " + file.toString());
            File output = writeTileToFile(is, file, mFilePath);
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    private File writeTileToFile(InputStream inStream, File file, String path) throws Exception {
        File filePath = new File(path);
        filePath.mkdirs();
        FileOutputStream outStream = new FileOutputStream(file);
        int bufferSize = 1024;
        byte[] buffer = new byte[bufferSize];
        int len = 0;
        while ((len = inStream.read(buffer)) != -1) {
            outStream.write(buffer, 0, len);
        }
        if(outStream!=null) outStream.close();
        return file;
    }

}
