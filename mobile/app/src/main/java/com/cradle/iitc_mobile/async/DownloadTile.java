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

    private final String mFilePath;

    public DownloadTile(final String path) {
        mFilePath = path;

    }

    @Override
    protected Boolean doInBackground(final String... urls) {
        URL tileUrl = null;
        URLConnection conn = null;
        try {
            tileUrl = new URL(urls[0]);
            conn = tileUrl.openConnection();
            final File file = new File(mFilePath);
            // some tiles don't have the lastModified header field set
            // ...update tile every two month
            final long updateTime = 2 * 30 * 24 * 60 * 60 * 1000;
            final long systemTime = System.currentTimeMillis();
            final long urlLM = conn.getLastModified();
            final long fileLM = file.lastModified();
            if (urlLM == 0 && (fileLM > systemTime - updateTime)) return true;
            // update tile if needed, else return
            if (urlLM < fileLM) return true;
            InputStream is = null;
            is = conn.getInputStream();
            Log.d("writing to file: " + file.toString());
            writeTileToFile(is, file);
        } catch (final IOException e) {
            return false;
        }
        return true;
    }

    private void writeTileToFile(final InputStream inStream, final File file) throws IOException {
        file.getParentFile().mkdirs();
        final FileOutputStream outStream = new FileOutputStream(file);

        IITC_FileManager.copyStream(inStream, outStream, true);
    }
}
