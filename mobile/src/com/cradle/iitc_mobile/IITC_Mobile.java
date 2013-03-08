package com.cradle.iitc_mobile;

import com.cradle.iitc_mobile.R;

import android.os.Bundle;
import android.os.Handler;
import android.app.Activity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.webkit.WebChromeClient;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

	private IITC_WebView iitc_view;
	private boolean back_button_pressed = false;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);

		// we do not want to reload our page every time we switch orientations...
		// so restore state if activity was already created
		if(savedInstanceState != null) {
			((IITC_WebView)findViewById(R.id.webview)).restoreState(savedInstanceState);
		}
		else {
			// load new iitc web view with ingress intel page
			iitc_view= (IITC_WebView) findViewById(R.id.webview);
			iitc_view.setWebChromeClient(new WebChromeClient());
			iitc_view.loadUrl("https://www.ingress.com/intel");

			// listen to touches (think we need this)
			iitc_view.setOnTouchListener(new OnTouchListener() {
				@Override
				public boolean onTouch(View v, MotionEvent event) {
					back_button_pressed = false;
					// return false to indicate, that we don't consumed this event. this leads
					// to the execution of our touch event
					return false;
				}
			});
		}
	}

	// save instance state to avoid reloading on orientation change
	@Override
	protected void onSaveInstanceState(Bundle outState) {
		iitc_view.saveState(outState);
	}

	// we want a self defined behavior on resume
	@Override
	protected void onResume() {
		super.onResume();
		this.back_button_pressed = false;
	}

	// we want a self defined behavior for the back button
	@Override
	public void onBackPressed() {
		if (this.back_button_pressed) {
			super.onBackPressed();
			return;
		}

		iitc_view.loadUrl("javascript: window.goBack();");
		this.back_button_pressed = true;
		Toast.makeText(this, "Press twice to exit", Toast.LENGTH_SHORT).show();

		// reset back button after 0.5 seconds
		new Handler().postDelayed(new Runnable() {
			@Override
			public void run() {
				back_button_pressed=false;
			}
		}, 500);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle item selection
		switch (item.getItemId()) {
		case R.id.reload_button:
			iitc_view.reload();
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}
}
