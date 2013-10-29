package com.cradle.iitc_mobile;

import android.app.Application;
import android.preference.PreferenceManager;

import java.io.File;

/*
 * To write the WebView cache to external storage we need to override the
 * getCacheDir method of the main application. Some internal Android code seems
 * to call getApplicationContext().getCacheDir(); instead of
 * getContext().getCacheDir(); to decide where to store and read cached files.
 */
public class IITC_Application extends Application {
    @Override
    public File getCacheDir() {
        if (PreferenceManager.getDefaultSharedPreferences(this).getBoolean("pref_external_storage", false)) {
            return (getExternalCacheDir() != null) ? getExternalCacheDir() : super.getCacheDir();
        } else {
            return super.getCacheDir();
        }
    }
}
