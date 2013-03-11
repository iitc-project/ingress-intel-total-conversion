package com.cradle.iitc_mobile;

import android.content.Context;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.IOException;

public class IITC_WebViewClient extends WebViewClient {
	private static final ByteArrayInputStream style = new ByteArrayInputStream(
		"body, #dashboard_container, #map_canvas { background: #000 !important; }".getBytes());
	private static final ByteArrayInputStream empty = new ByteArrayInputStream("".getBytes());

	private WebResourceResponse iitcjs;

	public IITC_WebViewClient(Context c) {
		try {
			loadIITC_JS(c);
		} catch(IOException e) {
			e.printStackTrace();
		}
	}

	public void loadIITC_JS(Context c) throws java.io.IOException {
			InputStream input;
			input = c.getAssets().open("iitc.js");

			int size = input.available();
			byte[] buffer = new byte[size];
			input.read(buffer);
			input.close();
			String js = new String(buffer);
			// need to wrap the mobile iitc.js version in a document ready. IITC
			// expects to be injected after the DOM has been loaded completely.
			// Since the mobile client injects IITC by replacing the gen_dashboard
			// file, IITC runs to early. The document.ready delays IITC long enough
			// so it boots correctly.
			js = "$(document).ready(function(){" + js + "});";

			iitcjs = new WebResourceResponse(
				"text/javascript",
				"UTF-8",
				new ByteArrayInputStream(js.getBytes())
			);
	};

	// enable https
	@Override
	public void onReceivedSslError (WebView view, SslErrorHandler handler, SslError error) {
		handler.proceed() ;
	};

	// Check every external resource if it’s okay to load it and maybe replace it
	// with our own content. This is used to block loading Niantic resources
	// which aren’t required and to inject IITC early into the site.
	// via http://stackoverflow.com/a/8274881/1684530
	@Override
	public WebResourceResponse shouldInterceptRequest (final WebView view, String url) {
		if(url.contains("/css/common.css")) {
			return new WebResourceResponse("text/css", "UTF-8", style);
		} else if(url.contains("gen_dashboard.js")) {
			return this.iitcjs;
		} else if(url.contains("/css/ap_icons.css")
				|| url.contains("/css/map_icons.css")
				|| url.contains("/css/misc_icons.css")
				|| url.contains("/css/style_full.css")
				|| url.contains("/css/style_mobile.css")
				|| url.contains("/css/portalrender.css")
				|| url.contains("js/analytics.js")
				|| url.contains("google-analytics.com/ga.js")) {
			return new WebResourceResponse("text/plain", "UTF-8", empty);
		} else {
			return super.shouldInterceptRequest(view, url);
		}
	}
}
