package com.cradle.iitc_mobile;

import android.util.Log;
import android.webkit.WebResourceResponse;

import com.cradle.iitc_mobile.async.DownloadTile;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Date;

public class IITC_TileManager {

    private final IITC_Mobile mIitc;
    private static final String TYPE = "image/*";
    private static final String ENCODING = null;

    IITC_TileManager(IITC_Mobile iitc) {
        mIitc = iitc;
    }

    public WebResourceResponse getTile(String url) throws Exception {
        String path = mIitc.getApplication().getFilesDir().toString() + "/" + url;
        path = path.replace("http://", "");
        path = path.replace("https://", "");
        String[] split = path.split("/");
        String fileName = split[split.length - 1];
        path = path.replace(fileName, "");
        File file = new File(path, fileName);
        if (file.exists()) {
            // asynchronously download tile if outdated, ignore date if not connected to wifi
            if (mIitc.getWebView().isConnectedToWifi()) new DownloadTile(path, fileName).execute(url);
            // return tile from storage
            InputStream in = new BufferedInputStream(new FileInputStream(file));
            return new WebResourceResponse(TYPE, ENCODING, in);
        } else {
            // asynchronously download tile to cache and let webviewclient load the resource
            new DownloadTile(path, fileName).execute(url);
            return null;
        }
    }
}
