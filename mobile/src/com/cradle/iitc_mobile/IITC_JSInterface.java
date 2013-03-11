package com.cradle.iitc_mobile;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;

// provide communication between IITC script and android app
public class IITC_JSInterface {

	// context of main activity
	Context context;

	IITC_JSInterface(Context c) {
		context = c;
	}

	// send intent for gmaps link
	@JavascriptInterface
	public void intentPosLink(String s) {
		Intent intent = new Intent(android.content.Intent.ACTION_VIEW,
				Uri.parse(s));
		context.startActivity(intent);
	}
}
