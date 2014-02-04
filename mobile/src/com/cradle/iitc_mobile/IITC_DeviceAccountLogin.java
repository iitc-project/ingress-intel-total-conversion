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

import com.cradle.iitc_mobile.IITC_Mobile.ResponseHandler;

/**
 * this class manages automatic login using the Google account stored on the device
 */
public class IITC_DeviceAccountLogin implements AccountManagerCallback<Bundle>, ResponseHandler {
    /**
     * Adapter to show available accounts in a ListView. Accounts are read from mAccounts
     */
    private class AccountAdapter extends BaseAdapter {
        @Override
        public int getCount() {
            return mAccounts.length;
        }

        @Override
        public Account getItem(final int position) {
            return mAccounts[position];
        }

        @Override
        public long getItemId(final int position) {
            return position;
        }

        @Override
        public View getView(final int position, final View convertView, final ViewGroup parent) {
            final LayoutInflater inflater = mIitc.getLayoutInflater();
            final View v = inflater.inflate(android.R.layout.simple_list_item_1, parent, false);

            final TextView tv = (TextView) v.findViewById(android.R.id.text1);
            tv.setText(mAccounts[position].name);

            return tv;
        }
    }

    private Account mAccount;
    private final AccountAdapter mAccountAdapter;
    private final AccountManager mAccountManager;
    private Account[] mAccounts;
    private final IITC_Mobile mIitc;
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
                public void onClick(final DialogInterface dialog, final int index) {
                    if (index >= 0 && index < mAccounts.length) {
                        mAccount = mAccounts[index];
                        startAuthentication();
                    }
                    dialog.cancel();
                }
            };

    public IITC_DeviceAccountLogin(final IITC_Mobile iitc, final WebView webView,
            final WebViewClient webViewClient) {
        mIitc = iitc;
        mWebView = webView;
        mAccountManager = AccountManager.get(iitc);
        mAccountAdapter = new AccountAdapter();

        // dialog that serves as a progress bar overlay
        mProgressbar = new AlertDialog.Builder(mIitc)
                .setCancelable(false)
                .setView(mIitc.getLayoutInflater().inflate(R.layout.dialog_progressbar, null))
                .create();
    }

    /**
     * display all available accounts to the user
     */
    private void displayAccountList() {
        new AlertDialog.Builder(mIitc)
                .setTitle(R.string.choose_account_to_login)
                .setSingleChoiceItems(mAccountAdapter, 0, onClickListener)
                .setNegativeButton(android.R.string.cancel, onClickListener)
                .create()
                .show();
    }

    /**
     * called when something failed. Shows a toast message. Classic login is still available
     */
    private void onLoginFailed() {
        Toast.makeText(mIitc, R.string.login_failed, Toast.LENGTH_SHORT).show();
    }

    /**
     * called to start authenticating using AccountManager.
     * <p/>
     * After a token is created, AccountManager will call the run() method.
     */
    private void startAuthentication() {
        mProgressbar.show();

        mAccountManager.getAuthToken(mAccount, mAuthToken, null, mIitc, this, null);
    }

    /**
     * called by IITC_Mobile when the authentication activity has finished.
     */
    @Override
    public void onActivityResult(final int resultCode, final Intent data) {
        if (resultCode == Activity.RESULT_OK) {
            // authentication activity succeeded, request token again
            startAuthentication();
        } else {
            onLoginFailed();
        }
    }

    /**
     * called by AccountManager
     */
    @Override
    public void run(final AccountManagerFuture<Bundle> value) {
        mProgressbar.hide();

        try {
            final Intent launch = (Intent) value.getResult().get(AccountManager.KEY_INTENT);
            if (launch != null) {
                // There is a reason we need to start the given activity if we want an
                // authentication token. (Could be user confirmation or something else. Whatever,
                // we have to start it) IITC_Mobile will call it using startActivityForResult
                mIitc.startActivityForResult(launch, this);
                return;
            }

            final String result = value.getResult().getString(AccountManager.KEY_AUTHTOKEN);
            if (result != null) {
                // authentication succeeded, we can load the given url, which will redirect
                // back to the intel map
                mWebView.loadUrl(result);
                mIitc.loginSucceeded();
            } else {
                onLoginFailed();
            }
        } catch (final Exception e) {
            onLoginFailed();
        }
    }

    /**
     * start authentication
     * <p/>
     * if we already have a username (e.g. because the existing login has timed out), we can directly start
     * authentication if an account with that username is found.
     */
    public void startLogin(final String realm, final String accountName, final String args) {
        mAccounts = mAccountManager.getAccountsByType(realm);
        mAccountAdapter.notifyDataSetChanged();
        mAuthToken = "weblogin:" + args;

        if (mAccounts.length == 0) return;

        for (final Account account : mAccounts) {
            if (account.name.equals(accountName)) {
                mAccountManager.getAuthToken(account, mAuthToken, null, mIitc, this, null);
                return;
            }
        }

        displayAccountList();
    }
}
