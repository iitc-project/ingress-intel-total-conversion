package com.cradle.iitc_mobile;

import android.app.AlertDialog.Builder;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.preference.DialogPreference;
import android.text.Html;
import android.text.method.LinkMovementMethod;
import android.util.AttributeSet;
import android.widget.TextView;

public class IITC_AboutDialogPreference extends DialogPreference {

    private final Context mContext;

    public IITC_AboutDialogPreference(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.mContext = context;
    }

    /*
     * start an about-dialog...I found no better way for clickable
     * links in a TextView then using Html.fromHtml...Linkify is just broken and
     * does not understand html href tags...so let's tag the @string/about_msg
     * with CDATA and use Html.fromHtml(...) for clickable hrefs with tags.
     */
    @Override
    protected void onPrepareDialogBuilder(Builder builder) {
        final TextView message = new TextView(mContext);
        String about_msg = mContext.getText(R.string.pref_about_msg).toString();
        message.setText(Html.fromHtml(about_msg));
        message.setMovementMethod(LinkMovementMethod.getInstance());
        builder.setView(message).setTitle(R.string.about)
                .setIcon(android.R.drawable.ic_dialog_info)
                .setNeutralButton(R.string.close, new OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });
        super.onPrepareDialogBuilder(builder);
    }

}
