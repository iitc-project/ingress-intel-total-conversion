package com.cradle.iitc_mobile;

import android.net.http.SslError;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class IITC_WebViewClient extends WebViewClient {

	// enable https
	@Override
	public void onReceivedSslError (WebView view, SslErrorHandler handler, SslError error) {
		handler.proceed() ;
	};

	// injecting IITC when page is loaded
	@Override
	public void onPageFinished(WebView web, String Url) {
		Log.d("loading finish", web.getUrl());
		if (web.getUrl().contains("ingress.com/intel") && !web.getUrl().contains("accounts")) {
			// first check for cookies, than inject javascript
			// this enables the user to login if necessary
			CookieManager cm = CookieManager.getInstance();
			final String cookie = cm.getCookie("https://www.ingress.com/intel");
			if(cookie != null) {
				web.loadUrl("javascript: (function() { "
						+ "var script=document.createElement('script');"
						+ "script.type='text/javascript';"
						+ "script.src='https://iitcserv.appspot.com/iitc-nightly/iitc-nightly-latest.user.js';"
						+ "document.getElementsByTagName('head').item(0).appendChild(script);"
						+ "})()");
			}
		}
	}
}
