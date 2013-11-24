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

/**
 * this class manages automatic login using the Google account stored on the device
 */
public class IITC_DeviceAccountLogin implements AccountManagerCallback<Bundle> {
    /**
     * Adapter to show available accounts in a ListView. Accounts are read from mAccounts
     */
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
    private final AccountAdapter mAccountAdapter;
    private final AccountManager mAccountManager;
    private Account[] mAccounts;
    private final IITC_Mobile mActivity;
    private String mAuthToken;
    private final AlertDialog mProgressbar;
    private final WebView mWebView;

    /**
     * This listener is invoked when an item in the account list is selected.
     * (It is also used when the 'cancel' button is clicked, (in which case `index` is <0)
     */
    private final DialogInterface.OnClickListener onClickListener =
            new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int index) {
                    if (index >= 0 && index < mAccounts.length) {
                        mAccount = mAccounts[index];
                        startAuthentication();
                    }
                    dialog.cancel();
                }
            };

    public IITC_DeviceAccountLogin(IITC_Mobile activity, WebView webView,
                                   WebViewClient webViewClient) {
        mActivity = activity;
        mWebView = webView;
        mAccountManager = AccountManager.get(activity);
        mAccountAdapter = new AccountAdapter();

        // dialog that serves as a progress bar overlay
        mProgressbar = new AlertDialog.Builder(mActivity)
                .setCancelable(false)
                .setView(mActivity.getLayoutInflater().inflate(R.layout.dialog_progressbar, null))
                .create();
    }

    /**
     * display all available accounts to the user
     */
    private void displayAccountList() {
        AlertDialog.Builder builder = new AlertDialog.Builder(mActivity)
                .setTitle(R.string.choose_account_to_login)
                .setSingleChoiceItems(mAccountAdapter, 0, onClickListener)
                .setNegativeButton(android.R.string.cancel, onClickListener);

        AlertDialog dialog = builder.create();
        dialog.show();
    }

    /**
     * called when something failed. Shows a toast message. Classic login is still available
     */
    private void onLoginFailed() {
        Toast.makeText(mActivity, R.string.login_failed, Toast.LENGTH_SHORT).show();
    }

    /**
     * called to start authenticating using AccountManager.
     * <p/>
     * After a token is created, AccountManager will call the run() method.
     */
    private void startAuthentication() {
        mProgressbar.show();

        mAccountManager.getAuthToken(mAccount, mAuthToken, null, mActivity, this, null);
    }

    /**
     * called by IITC_Mobile when the authentication activity has finished.
     */
    public void onActivityResult(int resultCode, Intent data) {
        if (resultCode == Activity.RESULT_OK)
        // authentication activity succeeded, request token again
        {
            startAuthentication();
        } else {
            onLoginFailed();
        }
    }

    /**
     * called by AccountManager
     */
    @Override
    public void run(AccountManagerFuture<Bundle> value) {
        mProgressbar.hide();

        try {
            Intent launch = (Intent) value.getResult().get(AccountManager.KEY_INTENT);
            if (launch != null) {
                // There is a reason we need to start the given activity if we want an
                // authentication token. (Could be user confirmation or something else. Whatever,
                // we have to start it) IITC_Mobile will call it using startActivityForResult
                mActivity.startLoginActivity(launch);
                return;
            }

            String result = value.getResult().getString(AccountManager.KEY_AUTHTOKEN);
            if (result != null) {
                // authentication succeeded, we can load the given url, which will redirect
                // back to the intel map
                mWebView.loadUrl(result);
                mActivity.loginSucceeded();
            } else {
                onLoginFailed();
            }
        } catch (Exception e) {
            onLoginFailed();
        }
    }

    /**
     * start authentication
     * <p/>
     * if we already have a username (e.g. because the existing login has timed out),
     * we can directly start authentication if an account with that username is found.
     */
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
