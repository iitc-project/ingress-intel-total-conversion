/*
* Copyright (C) 2010 The Android Open Source Project
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
package com.cradle.iitc_mobile;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;
import android.widget.TextView.OnEditorActionListener;

/**
* HTTP authentication dialog.
*/
public class HttpAuthenticationDialog {

    private final Context mContext;

    private final String mHost;
    private final String mRealm;

    private AlertDialog mDialog;
    private TextView mUsernameView;
    private TextView mPasswordView;

    private OkListener mOkListener;
    private CancelListener mCancelListener;

    /**
* Creates an HTTP authentication dialog.
*/
    public HttpAuthenticationDialog(Context context, String host, String realm) {
        mContext = context;
        mHost = host;
        mRealm = realm;
        createDialog();
    }

    private String getUsername() {
        return mUsernameView.getText().toString();
    }

    private String getPassword() {
        return mPasswordView.getText().toString();
    }

    /**
* Sets the listener that will be notified when the user submits the credentials.
*/
    public void setOkListener(OkListener okListener) {
        mOkListener = okListener;
    }

    /**
* Sets the listener that will be notified when the user cancels the authentication
* dialog.
*/
    public void setCancelListener(CancelListener cancelListener) {
        mCancelListener = cancelListener;
    }

    /**
* Shows the dialog.
*/
    public void show() {
        mDialog.show();
        mUsernameView.requestFocus();
    }

    /**
* Hides, recreates, and shows the dialog. This can be used to handle configuration changes.
*/
    public void reshow() {
        String username = getUsername();
        String password = getPassword();
        int focusId = mDialog.getCurrentFocus().getId();
        mDialog.dismiss();
        createDialog();
        mDialog.show();
        if (username != null) {
            mUsernameView.setText(username);
        }
        if (password != null) {
            mPasswordView.setText(password);
        }
        if (focusId != 0) {
            mDialog.findViewById(focusId).requestFocus();
        } else {
            mUsernameView.requestFocus();
        }
    }

    private void createDialog() {
        LayoutInflater factory = LayoutInflater.from(mContext);
        View v = factory.inflate(R.layout.http_authentication, null);
        mUsernameView = (TextView) v.findViewById(R.id.username_edit);
        mPasswordView = (TextView) v.findViewById(R.id.password_edit);
        mPasswordView.setOnEditorActionListener(new OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    mDialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
                    return true;
                }
                return false;
            }
        });

        String title = mContext.getText(R.string.sign_in_to).toString();
        title = String.format(title, mHost, mRealm);

        mDialog = new AlertDialog.Builder(mContext)
                .setTitle(title)
                .setIconAttribute(android.R.attr.alertDialogIcon)
                .setView(v)
                .setPositiveButton(R.string.action, new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int whichButton) {
                        if (mOkListener != null) {
                            mOkListener.onOk(mHost, mRealm, getUsername(), getPassword());
                        }
                    }})
                .setNegativeButton(R.string.cancel,new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int whichButton) {
                        if (mCancelListener != null) mCancelListener.onCancel();
                    }})
                .setOnCancelListener(new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface dialog) {
                        if (mCancelListener != null) mCancelListener.onCancel();
                    }})
                .create();

        // Make the IME appear when the dialog is displayed if applicable.
        mDialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
    }

    /**
* Interface for listeners that are notified when the user submits the credentials.
*/
    public interface OkListener {
        void onOk(String host, String realm, String username, String password);
    }

    /**
* Interface for listeners that are notified when the user cancels the dialog.
*/
    public interface CancelListener {
        void onCancel();
    }
}
