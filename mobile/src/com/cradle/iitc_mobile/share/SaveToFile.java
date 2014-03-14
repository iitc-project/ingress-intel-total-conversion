package com.cradle.iitc_mobile.share;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.Window;

import com.cradle.iitc_mobile.IITC_FileManager;
import com.cradle.iitc_mobile.Log;
import com.cradle.iitc_mobile.R;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

@TargetApi(19)
public class SaveToFile extends Activity implements Runnable {
    private static final int REQUEST_SAVE_FILE = 1;
    private Uri mData;

    @Override
    protected void onActivityResult(final int requestCode, final int resultCode, final Intent data) {
        if (requestCode == REQUEST_SAVE_FILE) {
            if (resultCode != Activity.RESULT_OK || data == null) {
                finish();
                return;
            }
            mData = data.getData();
            (new Thread(this)).start();
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
        setProgressBarIndeterminate(true);
        setProgressBarIndeterminateVisibility(true);

        setContentView(R.layout.dialog_progressbar);

        final Intent intent = getIntent();
        if (!(intent.hasExtra(Intent.EXTRA_STREAM) || intent.hasExtra(Intent.EXTRA_TEXT))) {
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        String filename = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (intent.hasExtra(Intent.EXTRA_STREAM)) {
            final Uri src = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (src.getLastPathSegment() != null) filename = src.getLastPathSegment();
        }

        final Intent request = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                .setType(intent.getType())
                .addCategory(Intent.CATEGORY_OPENABLE)
                .putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(request, REQUEST_SAVE_FILE);
    }

    @Override
    public void run() {
        final Intent intent = getIntent();
        if (mData == null) {
            finish();
            return;
        }

        try {
            final ParcelFileDescriptor fdOut = getContentResolver().openFileDescriptor(mData, "w");
            final FileOutputStream os = new FileOutputStream(fdOut.getFileDescriptor());

            if (intent.hasExtra(Intent.EXTRA_STREAM)) {
                final Uri src = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                final ParcelFileDescriptor fdIn = getContentResolver().openFileDescriptor(src, "r");
                final FileInputStream is = new FileInputStream(fdIn.getFileDescriptor());
                IITC_FileManager.copyStream(is, os, true);
            } else if (intent.hasExtra(Intent.EXTRA_TEXT)) {
                os.write(intent.getStringExtra(Intent.EXTRA_TEXT).getBytes());
                os.close();
            }
            fdOut.close();
        } catch (final IOException e) {
            Log.w("Could not save file!", e);
        }
        finish();
    }

}
