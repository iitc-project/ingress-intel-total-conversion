package com.cradle.iitc_mobile.async;

import android.os.AsyncTask;

import com.cradle.iitc_mobile.IITC_FileManager;
import com.cradle.iitc_mobile.Log;

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
            Log.d("writing to file: " + file.toString());
            writeTileToFile(is, file);
        } catch (IOException e) {
            return false;
        }
        return true;
    }

    private void writeTileToFile(InputStream inStream, File file) throws IOException {
        file.getParentFile().mkdirs();
        FileOutputStream outStream = new FileOutputStream(file);

        IITC_FileManager.copyStream(inStream, outStream, true);
    }
}
