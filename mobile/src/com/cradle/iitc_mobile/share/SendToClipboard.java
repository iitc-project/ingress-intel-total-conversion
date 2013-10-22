package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import com.cradle.iitc_mobile.R;

public class SendToClipboard extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String text = getIntent().getStringExtra(Intent.EXTRA_TEXT);

        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);

        ClipData clip = ClipData.newPlainText("Copied Text ", text);
        clipboard.setPrimaryClip(clip);

        Toast.makeText(this, R.string.msg_copied, Toast.LENGTH_SHORT).show();

        finish();
        setResult(RESULT_OK);
    }
}
