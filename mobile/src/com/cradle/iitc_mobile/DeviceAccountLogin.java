package com.cradle.iitc_mobile;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.accounts.AccountManagerCallback;
import android.accounts.AccountManagerFuture;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.BaseAdapter;
import android.widget.TextView;
import android.widget.Toast;

public class DeviceAccountLogin implements AccountManagerCallback<Bundle> {
    private class AccountAdapter extends BaseAdapter {
        @Override
        public int getCount() {
            return mAccounts.length;
        }

        @Override
        public Account getItem(int position) {
            return mAccounts[position];
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            LayoutInflater inflater = mActivity.getLayoutInflater();
            View v = inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

            TextView tv = (TextView) v.findViewById(android.R.id.text1);
            tv.setText(mAccounts[position].name);

            return tv;
        }
    }

    private Account mAccount;
    private AccountAdapter mAccountAdapter;
    private AccountManager mAccountManager;
    private Account[] mAccounts;
    private IITC_Mobile mActivity;
    private String mAuthToken;
    private AlertDialog mProgressbar;
    private WebView mWebView;

    private DialogInterface.OnClickListener onClickListener = new DialogInterface.OnClickListener() {
        @Override
        public void onClick(DialogInterface dialog, int which) {
            if (which >= 0 && which < mAccounts.length) {
                mAccount = mAccounts[which];
                startAuthentication();
            }
            dialog.cancel();
        }
    };

    public DeviceAccountLogin(IITC_Mobile activity, WebView webView, WebViewClient webViewClient) {
        mActivity = activity;
        mWebView = webView;
        mAccountManager = AccountManager.get(activity);
        mAccountAdapter = new AccountAdapter();

        mProgressbar = new AlertDialog.Builder(mActivity)
                .setCancelable(false)
                .setView(mActivity.getLayoutInflater().inflate(R.layout.dialog_progressbar, null))
                .create();
    }

    private void displayAccountList() {
        AlertDialog.Builder builder = new AlertDialog.Builder(mActivity)
                .setTitle(R.string.choose_account_to_login)
                .setSingleChoiceItems(mAccountAdapter, 0, onClickListener)
                .setNegativeButton(android.R.string.cancel, onClickListener);

        AlertDialog dialog = builder.create();
        dialog.show();
    }

    private void onLoginFailed() {
        Toast.makeText(mActivity, R.string.login_failed, Toast.LENGTH_SHORT).show();
    }

    private void startAuthentication() {
        mProgressbar.show();

        mAccountManager.getAuthToken(mAccount, mAuthToken, null, mActivity, this, null);
    }

    public void onActivityResult(int resultCode, Intent data) {
        if (resultCode == Activity.RESULT_OK)
            startAuthentication();
        else
            onLoginFailed();
    }

    @Override
    public void run(AccountManagerFuture<Bundle> value) {
        mProgressbar.hide();

        try {
            Intent launch = (Intent) value.getResult().get(AccountManager.KEY_INTENT);
            if (launch != null) {
                mActivity.startLoginActivity(launch);
                return;
            }

            String result = value.getResult().getString(AccountManager.KEY_AUTHTOKEN);
            if (result != null) {
                mWebView.loadUrl(result);
                mActivity.loginSucceded();
            } else {
                onLoginFailed();
            }
        } catch (Exception e) {
            onLoginFailed();
        }
    }

    public void startLogin(String realm, String accountName, String args) {
        mAccounts = mAccountManager.getAccountsByType(realm);
        mAccountAdapter.notifyDataSetChanged();
        mAuthToken = "weblogin:" + args;

        if (mAccounts.length == 0) {
            return;
        }

        for (Account account : mAccounts) {
            if (account.name.equals(accountName)) {
                mAccountManager.getAuthToken(account, mAuthToken, null, mActivity, this, null);
                return;
            }
        }

        displayAccountList();
    }
}
