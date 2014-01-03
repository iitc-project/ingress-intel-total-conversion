package com.cradle.iitc_mobile;

import android.webkit.ConsoleMessage;
import android.webkit.ConsoleMessage.MessageLevel;

import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

public final class Log {
    private static final HashMap<ConsoleMessage.MessageLevel, Integer> CONSOLE_MAPPING;
    private static final List<Receiver> RECEIVERS = new LinkedList<Log.Receiver>();

    public static final String CONSOLE_TAG = "iitcm-console";
    public static final String DEFAULT_TAG = "iitcm";

    public static final int ASSERT = android.util.Log.ASSERT;
    public static final int DEBUG = android.util.Log.DEBUG;
    public static final int ERROR = android.util.Log.ERROR;
    public static final int INFO = android.util.Log.INFO;
    public static final int VERBOSE = android.util.Log.VERBOSE;
    public static final int WARN = android.util.Log.WARN;

    static {
        CONSOLE_MAPPING = new HashMap<ConsoleMessage.MessageLevel, Integer>();
        CONSOLE_MAPPING.put(MessageLevel.TIP, android.util.Log.VERBOSE);
        CONSOLE_MAPPING.put(MessageLevel.LOG, android.util.Log.INFO);
        CONSOLE_MAPPING.put(MessageLevel.WARNING, android.util.Log.WARN);
        CONSOLE_MAPPING.put(MessageLevel.ERROR, android.util.Log.ERROR);
        CONSOLE_MAPPING.put(MessageLevel.DEBUG, android.util.Log.DEBUG);
    };

    private static synchronized void log(int priority, String tag, String msg, Throwable tr) {
        Date now = new Date();

        Message message = new Message(now, priority, tag, msg, tr);
        for (Receiver receiver : RECEIVERS) {
            receiver.handle(message);
        }
    }

    public static void d(String msg) {
        d(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.d}
     */
    @Deprecated
    public static void d(String tag, String msg) {
        log(android.util.Log.DEBUG, tag, msg, null);
        android.util.Log.d(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.d}
     */
    @Deprecated
    public static void d(String tag, String msg, Throwable tr) {
        log(android.util.Log.DEBUG, tag, msg, tr);
        android.util.Log.d(tag, msg, tr);
    }

    public static void d(String msg, Throwable tr) {
        d(DEFAULT_TAG, msg, tr);
    }

    public static void e(String msg) {
        e(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.e}
     */
    @Deprecated
    public static void e(String tag, String msg) {
        log(android.util.Log.ERROR, tag, msg, null);
        android.util.Log.e(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.e}
     */
    @Deprecated
    public static void e(String tag, String msg, Throwable tr) {
        log(android.util.Log.ERROR, tag, msg, tr);
        android.util.Log.e(tag, msg, tr);
    }

    public static void e(String msg, Throwable tr) {
        e(DEFAULT_TAG, msg, tr);
    }

    public static void i(String msg) {
        i(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.i}
     */
    @Deprecated
    public static void i(String tag, String msg) {
        log(android.util.Log.INFO, tag, msg, null);
        android.util.Log.i(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.i}
     */
    @Deprecated
    public static void i(String tag, String msg, Throwable tr) {
        log(android.util.Log.INFO, tag, msg, tr);
        android.util.Log.i(tag, msg, tr);
    }

    public static void i(String msg, Throwable tr) {
        i(DEFAULT_TAG, msg, tr);
    }

    public static boolean log(ConsoleMessage message) {
        String msg = message.sourceId();
        if ("".equals(msg)) msg = "<no source>";
        msg += ":" + message.lineNumber() + ": " + message.message();

        final Integer priority = CONSOLE_MAPPING.get(message.messageLevel());

        if (priority != null) {
            log(priority, CONSOLE_TAG, msg, null);
            android.util.Log.println(priority, CONSOLE_TAG, msg);
            return true;
        }

        Log.w(CONSOLE_TAG, "Warning: unknown message level in Logger.log(ConsoleMessage message): "
                + message.messageLevel().ordinal() + "/" + message.messageLevel().name());
        return false;
    }

    public static int println(int priority, String msg) {
        return println(priority, DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.println}
     */
    @Deprecated
    public static int println(int priority, String tag, String msg) {
        log(priority, tag, msg, null);
        return android.util.Log.println(priority, tag, msg);
    }

    public static void v(String msg) {
        v(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.v}
     */
    @Deprecated
    public static void v(String tag, String msg) {
        log(android.util.Log.VERBOSE, tag, msg, null);
        android.util.Log.v(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.v}
     */
    @Deprecated
    public static void v(String tag, String msg, Throwable tr) {
        log(android.util.Log.VERBOSE, tag, msg, tr);
        android.util.Log.v(tag, msg, tr);
    }

    public static void v(String msg, Throwable tr) {
        v(DEFAULT_TAG, msg, tr);
    }

    public static void w(String msg) {
        w(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.w}
     */
    @Deprecated
    public static void w(String tag, String msg) {
        log(android.util.Log.WARN, tag, msg, null);
        android.util.Log.w(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.w}
     */
    @Deprecated
    public static void w(String tag, String msg, Throwable tr) {
        log(android.util.Log.WARN, tag, msg, tr);
        android.util.Log.w(tag, msg, tr);
    }

    public static void w(String msg, Throwable tr) {
        w(DEFAULT_TAG, msg, tr);
    }

    private Log() {
        // prevent instantiation
        throw new UnsupportedOperationException();
    }

    public static class Message {
        private Date mDate;
        private String mMsg;
        private int mPriority;
        private String mTag;
        private Throwable mTr;

        private Message(Date date, int priority, String tag, String msg, Throwable tr) {
            mDate = date;
            mPriority = priority;
            mTag = tag;
            mMsg = msg;
            mTr = tr;
        }

        public Date getDate() {
            return this.mDate;
        }

        public String getMsg() {
            return this.mMsg;
        }

        public int getPriority() {
            return this.mPriority;
        }

        public String getTag() {
            return this.mTag;
        }

        public Throwable getTr() {
            return this.mTr;
        }
    }

    public static interface Receiver {
        void handle(Message message);
    }

    public static void removeReceiver(Log.Receiver receiver) {
        RECEIVERS.remove(receiver);
    }

    public static void addReceiver(Log.Receiver receiver) {
        RECEIVERS.add(receiver);
    }
}
