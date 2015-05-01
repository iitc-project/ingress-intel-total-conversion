/*
 * Copyright (C) 2013 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// package android.webkit;
package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.TextView;

import java.net.MalformedURLException;
import java.net.URL;

/**
 * Helper class to create JavaScript dialogs. It is used by
 * different WebView implementations.
 *
 * @hide Helper class for internal use
 */
public class IITC_JsDialogHelper {
    // Dialog types
    public static final int ALERT = 1;
    public static final int CONFIRM = 2;
    public static final int PROMPT = 3;
    public static final int UNLOAD = 4;

    private final String mDefaultValue;
    private final JsResult mResult;
    private final String mMessage;
    private final int mType;
    private final String mUrl;

    public IITC_JsDialogHelper(final int type, final WebView view, final String url,
            final String message, final String defaultValue, final JsResult result) {
        mResult = result;
        mDefaultValue = defaultValue;
        mMessage = message;
        mType = type;
        mUrl = url;

        showDialog(view.getContext());
    }

    @SuppressLint("InflateParams")
    private void showDialog(final Context context) {
        String title, displayMessage;
        int positiveTextId, negativeTextId;
        if (mType == UNLOAD) {
            title = context.getString(R.string.js_dialog_before_unload_title);
            displayMessage = context.getString(
                    R.string.js_dialog_before_unload, mMessage);
            positiveTextId = R.string.js_dialog_before_unload_positive_button;
            negativeTextId = R.string.js_dialog_before_unload_negative_button;
        } else {
            title = getJsDialogTitle(context);
            displayMessage = mMessage;
            positiveTextId = android.R.string.ok;
            negativeTextId = android.R.string.cancel;
        }
        final AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setTitle(title);
        builder.setOnCancelListener(new CancelListener());
        if (mType != PROMPT) {
            builder.setMessage(displayMessage);
            builder.setPositiveButton(positiveTextId, new PositiveListener(null));
        } else {
            final View view = LayoutInflater.from(context).inflate(
                    R.layout.js_prompt, null);
            final EditText edit = ((EditText) view.findViewById(R.id.value));
            edit.setText(mDefaultValue);
            builder.setPositiveButton(positiveTextId, new PositiveListener(edit));
            ((TextView) view.findViewById(R.id.message)).setText(mMessage);
            builder.setView(view);
        }
        if (mType != ALERT) {
            builder.setNegativeButton(negativeTextId, new CancelListener());
        }
        builder.show();
    }

    private class CancelListener implements DialogInterface.OnCancelListener,
            DialogInterface.OnClickListener {
        @Override
        public void onCancel(final DialogInterface dialog) {
            mResult.cancel();
        }

        @Override
        public void onClick(final DialogInterface dialog, final int which) {
            mResult.cancel();
        }
    }

    private class PositiveListener implements DialogInterface.OnClickListener {
        private final EditText mEdit;

        public PositiveListener(final EditText edit) {
            mEdit = edit;
        }

        @Override
        public void onClick(final DialogInterface dialog, final int which) {
            if (mEdit == null) {
                mResult.confirm();
            } else {
                ((JsPromptResult) mResult).confirm(mEdit.getText().toString());
            }
        }
    }

    private String getJsDialogTitle(final Context context) {
        String title = mUrl;
        if (URLUtil.isDataUrl(mUrl)) {
            // For data: urls, we just display 'JavaScript' similar to Chrome.
            title = context.getString(R.string.js_dialog_title_default);
        } else {
            try {
                final URL alertUrl = new URL(mUrl);
                // For example: "The page at 'http://www.mit.edu' says:"
                title = context.getString(R.string.js_dialog_title,
                        alertUrl.getProtocol() + "://" + alertUrl.getHost());
            } catch (final MalformedURLException ex) {
                // do nothing. just use the url as the title
            }
        }
        return title;
    }

    public boolean shouldInterrupt() {
        return true;
    }
}