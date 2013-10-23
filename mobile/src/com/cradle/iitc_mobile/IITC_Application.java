package com.cradle.iitc_mobile;

import android.app.Application;
import android.preference.PreferenceManager;

import java.io.File;

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
