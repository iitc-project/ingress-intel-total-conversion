package com.cradle.iitc_mobile;

import android.annotation.TargetApi;
import android.webkit.JavascriptInterface;

@TargetApi(19)
public class IITC_JSInterfaceKitkat extends IITC_JSInterface {
    public IITC_JSInterfaceKitkat(final IITC_Mobile iitc) {
        super(iitc);
    }

    @JavascriptInterface
    @Override
    public void saveFile(final String filename, final String type, final String content) {
        mIitc.getFileManager().new FileSaveRequest(filename, type, content);
    }
}
