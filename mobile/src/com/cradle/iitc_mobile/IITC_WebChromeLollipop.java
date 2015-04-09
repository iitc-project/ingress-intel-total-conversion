package com.cradle.iitc_mobile;

import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebView;

public class IITC_WebChromeLollipop extends IITC_WebChromeClient {
    public IITC_WebChromeLollipop(final IITC_Mobile iitc) {
        super(iitc);
    }

    @Override
    public boolean onJsAlert(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.ALERT, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsBeforeUnload(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.UNLOAD, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsConfirm(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.CONFIRM, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsPrompt(final WebView view, final String url, final String message, final String defaultValue, final JsPromptResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.PROMPT, view, url, message, defaultValue, result).shouldInterrupt();
    }
}
