package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.database.DataSetObserver;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.cradle.iitc_mobile.Log.Message;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;

public class IITC_LogAdapter extends ArrayAdapter<Log.Message> implements Log.Receiver {
    @SuppressLint("SimpleDateFormat")
    private static final SimpleDateFormat FORMATTER = new SimpleDateFormat("HH:mm:ss.SSS");

    private int mObservers = 0;
    private IITC_Mobile mIitc;

    public IITC_LogAdapter(IITC_Mobile iitc) {
        super(iitc, 0);
        mIitc = iitc;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        Message item = getItem(position);
        View v = mIitc.getLayoutInflater().inflate(R.layout.view_log_msg, parent, false);

        ImageView iv = (ImageView) v.findViewById(R.id.log_type);
        switch (item.getPriority()) {
            case Log.ASSERT:
            case Log.ERROR:
                iv.setImageResource(R.drawable.ic_action_error_red);
                break;
            case Log.WARN:
                iv.setImageResource(R.drawable.ic_action_warning_yellow);
                break;
            default:
                iv.setImageResource(R.drawable.ic_action_about);
        }

        TextView tv;

        tv = (TextView) v.findViewById(R.id.log_tag);
        tv.setText(item.getTag());

        tv = (TextView) v.findViewById(R.id.log_time);
        tv.setText(FORMATTER.format(item.getDate()));

        String msg = item.getMsg();
        if (item.getTr() != null) {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            item.getTr().printStackTrace(pw);

            if (msg == null || msg.isEmpty())
                msg = sw.toString();
            else
                msg += "\n" + sw.toString();
        }

        tv = (TextView) v.findViewById(R.id.log_msg);
        tv.setText(msg);

        return v;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public void unregisterDataSetObserver(DataSetObserver observer) {
        super.unregisterDataSetObserver(observer);
        mObservers--;

        if (mObservers < 1) {
            clear();
            Log.removeReceiver(this);
        }
    }

    @Override
    public void registerDataSetObserver(DataSetObserver observer) {
        super.registerDataSetObserver(observer);

        if (mObservers < 1)
            Log.addReceiver(this);

        mObservers++;
    }

    @Override
    public void handle(final Message message) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                insert(message, 0);
            }
        });
    }
}
