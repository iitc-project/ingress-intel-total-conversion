package com.cradle.iitc_mobile;

import android.database.DataSetObserver;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.cradle.iitc_mobile.Log.Message;

import java.io.PrintWriter;
import java.io.StringWriter;

public class IITC_LogAdapter extends ArrayAdapter<Log.Message> implements Log.Receiver {
    private final IITC_Mobile mIitc;
    private int mObservers = 0;

    public IITC_LogAdapter(final IITC_Mobile iitc) {
        super(iitc, 0);
        mIitc = iitc;
    }

    @Override
    public View getView(final int position, View v, final ViewGroup parent) {
        final Message item = getItem(position);

        ViewHolder holder;
        if (v != null && v.getTag() != null && v.getTag() instanceof ViewHolder) {
            holder = (ViewHolder) v.getTag();
        } else {
            v = mIitc.getLayoutInflater().inflate(R.layout.view_log_msg, parent, false);
            holder = new ViewHolder();
            holder.icon = (ImageView) v.findViewById(R.id.log_type);
            holder.tag = (TextView) v.findViewById(R.id.log_tag);
            holder.time = (TextView) v.findViewById(R.id.log_time);
            holder.msg = (TextView) v.findViewById(R.id.log_msg);
            v.setTag(holder);
        }

        switch (item.getPriority()) {
            case Log.ASSERT:
            case Log.ERROR:
                holder.icon.setImageResource(R.drawable.ic_action_error_red);
                break;
            case Log.WARN:
                holder.icon.setImageResource(R.drawable.ic_action_warning_yellow);
                break;
            default:
                holder.icon.setImageResource(R.drawable.ic_action_about);
        }

        holder.tag.setText(item.getTag());
        holder.time.setText(item.getDateString());

        String msg = item.getMsg();
        if (item.getTr() != null) {
            final StringWriter sw = new StringWriter();
            final PrintWriter pw = new PrintWriter(sw);
            item.getTr().printStackTrace(pw);

            if (msg == null || msg.isEmpty())
                msg = sw.toString();
            else
                msg += "\n" + sw.toString();
        }

        holder.msg.setText(msg);

        return v;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
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

    @Override
    public void registerDataSetObserver(final DataSetObserver observer) {
        super.registerDataSetObserver(observer);

        if (mObservers < 1)
            Log.addReceiver(this);

        mObservers++;
    }

    @Override
    public void unregisterDataSetObserver(final DataSetObserver observer) {
        super.unregisterDataSetObserver(observer);
        mObservers--;

        if (mObservers < 1) {
            clear();
            Log.removeReceiver(this);
        }
    }

    private class ViewHolder {
        private ImageView icon;
        private TextView msg;
        private TextView tag;
        private TextView time;
    }
}
