/********************************************************************************
	Ingress Intel Total Converion - Mobile & Tablet
	Android WebView wrapper/loader for iitc (ingress intel total conversion)
	iitc source @ https://github.com/breunigs/ingress-intel-total-conversion
	
	Original Author: Jason Grima - jason@jakbox.net
*********************************************************************************/


package com.jakbox.ingressTC;

import android.app.*;
import android.os.*;
import android.content.Context;
import android.view.*;
import android.widget.*;
import android.webkit.*;
import android.provider.Settings.Secure;
import android.util.Log;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.lang.StringBuffer;

public class MainActivity extends Activity
{
	WebView web; // webview to hold the ingress site (and login etc)
	WebView splash; // splash screen, just a bit of pretty
	MyChrome chrome; // for logging, progress, etc
	MyClient client; // for controlling the webview's
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
	{
		requestWindowFeature(Window.FEATURE_NO_TITLE); //  hide the app title bar, Xeen requested
        super.onCreate(savedInstanceState); 
		
		// little animated title/splash page for IngressIntelTC
		// separate webview so we can be loading stuff in the background		
		JSInterface js = new JSInterface(this, this); //js.setActivity(this);
		this.splash = new WebView(this);
		splash.getSettings().setJavaScriptEnabled(true); // because we use JS to trigger the CSS animation
		splash.getSettings().setAllowFileAccess(true); //  because the splash page is store in the apk
		splash.getSettings().setAllowFileAccessFromFileURLs(true); // in case we add more scripts/images to the splash page
		splash.loadUrl("file:///android_asset/js/ingressSplash.html"); // there is is!
		splash.addJavascriptInterface(js, "android"); 
		setContentView(splash);
		// righto, load the the website (ingress.com/intel) with a bunch of permissions that may/or not be needed		
		this.web = new WebView(this);
		this.client = new MyClient();
		web.setWebViewClient(this.client);
		web.getSettings().setJavaScriptEnabled(true);
		web.getSettings().setGeolocationEnabled(true);
		web.getSettings().setAllowFileAccess(true);
		web.getSettings().setAllowFileAccessFromFileURLs(true);
		web.getSettings().setDatabaseEnabled(true);
		web.getSettings().setDomStorageEnabled(true);
		web.getSettings().setGeolocationEnabled(true);
		
		this.chrome = new MyChrome(); // the chrome let's us get console and progress feedback from the page
		web.setWebChromeClient(this.chrome);
		web.addJavascriptInterface(js, "android"); // ready to go
		
    }
	
	public void onRestoreInstanceState(Bundle state) {
		this.splash.restoreState(state);
		this.web.restoreState(state);
	}
	public void onSaveInstanceState(Bundle state) {
		this.splash.saveState(state);
		this.web.saveState(state);	
	}
	
	public void showWeb() { setContentView(web); splash.destroy();  Log.d("com.jakbox.ingressTC", "Flipping to web/ingress view"); }
	public void showSplash() { setContentView(splash); web.destroy(); Log.d("com.jakbox.ingressTC", "Flipping to splash/loading"); }
	
	final class JSInterface {
		Context context; MainActivity act;
		public JSInterface (Context c, MainActivity a) { this.context = c; this.act = a; }
		public void setActivity(MainActivity a) { this.act = a; }
		// the @JavascriptInterface is needed for 4.2 devices to access this
		@JavascriptInterface
		public void pageReady(int ready) {
			if(ready != 0) {
				// the loader reports we're good to go, switch to ingress webview
				this.act.runOnUiThread(new Runnable() {
					public void run() { showWeb(); }
				});
			} else {
				// the loader reports we're not ready, switch to splash page
				this.act.runOnUiThread(new Runnable() {
					public void run() { showSplash(); }
				});
			}
		}
		@JavascriptInterface
		public void loadBehind(final String url) {
			this.act.runOnUiThread(new Runnable() {
				public void run() { 
					Log.d("com.jakbox.ingressTC", "Loading (Ingress?) website in back webview"); 
					web.loadUrl(url); /* push the url to the webview */ }
			});			
		}
	}
	
	private class MyClient extends WebViewClient {		
		@Override
		public boolean shouldOverrideUrlLoading(WebView web, String Url) { 
			return false; 
		}
		
		@Override
		public void onPageFinished(WebView web, String Url) {
		// here we conditionally load some external javascript	
			Log.d("com.jakbox.ingressTC", "Page loading, injecting IITC JS");
			if(web.getUrl().contains("ingress.com/intel")) { 
			// if NOT ingress, we may have been redirected to the google auth/login page
				web.loadUrl("javascript: window.stop(); ");
			// first stop the page from loading too much
				web.loadUrl("javascript: window.deviceID='"+Secure.getString(getContentResolver(), Secure.ANDROID_ID)+"'; ");
			// create a JS loader on the page
				web.loadUrl("javascript: if(!window.loadJS) { window.loadJS = function(scr) { var s = document.createElement('script'); s.src = scr+(scr.indexOf('file:///')==-1?'?ts="+System.currentTimeMillis()+"':''); s.type = 'text/javascript'; s.async = true; var st = document.getElementsByTagName('script')[0]; st.parentNode.insertBefore(s, st); } };");
			// actually hijack the page... if it's the right page... let the loader deal with that
			// should pull this loader into a local resource, maybe...
			// running it from the web for now ...
				web.loadUrl("javascript: if(!window.hijacked) { window.loadJS('http://mathphys.fsk.uni-heidelberg.de:8000/bootstrap.js'); window.hijacked = true;}");	
			}
		}		
	}

	private class MyChrome extends WebChromeClient {
		@Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
			// Always grant permission since the app itself requires location
			// permission and the user has therefore already granted it	
			callback.invoke(origin, true, false);
        }

    	public boolean onConsoleMessage(ConsoleMessage cm) {			
			// log window.console stuff into the syslog for ADB output
			Log.d("com.jakbox.ingressTC", cm.message() + " -- "
				+ (cm.sourceId()==null?"main document":cm.sourceId()) 
				+ ":Line " + cm.lineNumber() );
			return true;			
		}    
	}
}
