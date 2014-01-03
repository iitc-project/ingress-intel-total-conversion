package com.cradle.iitc_mobile.async;

import android.os.AsyncTask;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

public class DownloadTile extends AsyncTask<String, Void, Boolean> {

    private String mFilePath;

    public DownloadTile(String path) {
        mFilePath = path;

    }

    @Override
    protected Boolean doInBackground(String... urls) {
        URL tileUrl = null;
        URLConnection conn = null;
        try {
            tileUrl = new URL(urls[0]);
            conn = tileUrl.openConnection();
            File file = new File(mFilePath);
            // update tile if needed, else return
            if (conn.getLastModified() < file.lastModified()) return true;
            InputStream is = null;
            is = conn.getInputStream();
            Log.d("iitcm", "writing to file: " + file.toString());
            writeTileToFile(is, file);
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    private void writeTileToFile(InputStream inStream, File file) throws Exception {
        file.getParentFile().mkdirs();
        FileOutputStream outStream = new FileOutputStream(file);
        int bufferSize = 1024;
        byte[] buffer = new byte[bufferSize];
        int len = 0;
        while ((len = inStream.read(buffer)) != -1) {
            outStream.write(buffer, 0, len);
        }
        if(outStream!=null) outStream.close();
    }

}
