package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.webkit.ConsoleMessage;
import android.webkit.ConsoleMessage.MessageLevel;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Log {
    private static final HashMap<ConsoleMessage.MessageLevel, Integer> CONSOLE_MAPPING;
    @SuppressLint("SimpleDateFormat")
    private static final SimpleDateFormat FORMATTER = new SimpleDateFormat("HH:mm:ss.SSS");
    private static final List<Receiver> RECEIVERS = new LinkedList<Log.Receiver>();
    private static final Pattern URL_PATTERN;

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

        URL_PATTERN = Pattern.compile("^https?://([a-z.-]+)" + Pattern.quote(IITC_FileManager.DOMAIN) + "/(.*)$",
                Pattern.CASE_INSENSITIVE);
    };

    private static synchronized void log(final int priority, final String tag, final String msg, final Throwable tr) {
        final Date now = new Date();

        final Message message = new Message(now, priority, tag, msg, tr);
        for (final Receiver receiver : RECEIVERS) {
            receiver.handle(message);
        }
    }

    public static void addReceiver(final Log.Receiver receiver) {
        RECEIVERS.add(receiver);
    }

    public static void d(final String msg) {
        d(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.d}
     */
    @Deprecated
    public static void d(final String tag, final String msg) {
        log(android.util.Log.DEBUG, tag, msg, null);
        android.util.Log.d(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.d}
     */
    @Deprecated
    public static void d(final String tag, final String msg, final Throwable tr) {
        log(android.util.Log.DEBUG, tag, msg, tr);
        android.util.Log.d(tag, msg, tr);
    }

    public static void d(final String msg, final Throwable tr) {
        d(DEFAULT_TAG, msg, tr);
    }

    public static void d(final Throwable tr) {
        d("Unexpected " + tr.getClass().getCanonicalName(), tr);
    }

    public static void e(final String msg) {
        e(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.e}
     */
    @Deprecated
    public static void e(final String tag, final String msg) {
        log(android.util.Log.ERROR, tag, msg, null);
        android.util.Log.e(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.e}
     */
    @Deprecated
    public static void e(final String tag, final String msg, final Throwable tr) {
        log(android.util.Log.ERROR, tag, msg, tr);
        android.util.Log.e(tag, msg, tr);
    }

    public static void e(final String msg, final Throwable tr) {
        e(DEFAULT_TAG, msg, tr);
    }

    public static void e(final Throwable tr) {
        e("Unexpected " + tr.getClass().getCanonicalName(), tr);
    }

    public static void i(final String msg) {
        i(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.i}
     */
    @Deprecated
    public static void i(final String tag, final String msg) {
        log(android.util.Log.INFO, tag, msg, null);
        android.util.Log.i(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.i}
     */
    @Deprecated
    public static void i(final String tag, final String msg, final Throwable tr) {
        log(android.util.Log.INFO, tag, msg, tr);
        android.util.Log.i(tag, msg, tr);
    }

    public static void i(final String msg, final Throwable tr) {
        i(DEFAULT_TAG, msg, tr);
    }

    public static void i(final Throwable tr) {
        i("Unexpected " + tr.getClass().getCanonicalName(), tr);
    }

    public static boolean log(final ConsoleMessage message) {
        String msg = message.sourceId();

        if (msg == null || "".equals(msg)) {
            msg = "<no source>";
        } else {
            final Matcher matcher = URL_PATTERN.matcher(msg);
            if (matcher.matches()) {
                msg = "<" + matcher.group(1) + "/" + matcher.group(2) + ">";
            }
        }

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

    public static int println(final int priority, final String msg) {
        return println(priority, DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.println}
     */
    @Deprecated
    public static int println(final int priority, final String tag, final String msg) {
        log(priority, tag, msg, null);
        return android.util.Log.println(priority, tag, msg);
    }

    public static void removeReceiver(final Log.Receiver receiver) {
        RECEIVERS.remove(receiver);
    }

    public static void v(final String msg) {
        v(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.v}
     */
    @Deprecated
    public static void v(final String tag, final String msg) {
        log(android.util.Log.VERBOSE, tag, msg, null);
        android.util.Log.v(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.v}
     */
    @Deprecated
    public static void v(final String tag, final String msg, final Throwable tr) {
        log(android.util.Log.VERBOSE, tag, msg, tr);
        android.util.Log.v(tag, msg, tr);
    }

    public static void v(final String msg, final Throwable tr) {
        v(DEFAULT_TAG, msg, tr);
    }

    public static void v(final Throwable tr) {
        v("Unexpected " + tr.getClass().getCanonicalName(), tr);
    }

    public static void w(final String msg) {
        w(DEFAULT_TAG, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.w}
     */
    @Deprecated
    public static void w(final String tag, final String msg) {
        log(android.util.Log.WARN, tag, msg, null);
        android.util.Log.w(tag, msg);
    }

    /**
     * @deprecated A default tag is provided by {@link Log.w}
     */
    @Deprecated
    public static void w(final String tag, final String msg, final Throwable tr) {
        log(android.util.Log.WARN, tag, msg, tr);
        android.util.Log.w(tag, msg, tr);
    }

    public static void w(final String msg, final Throwable tr) {
        w(DEFAULT_TAG, msg, tr);
    }

    public static void w(final Throwable tr) {
        w("Unexpected " + tr.getClass().getCanonicalName(), tr);
    }

    private Log() {
        // prevent instantiation
        throw new UnsupportedOperationException();
    }

    public static class Message {
        private final Date mDate;
        private final String mMsg;
        private final int mPriority;
        private final String mTag;
        private final Throwable mTr;

        private Message(final Date date, final int priority, final String tag, final String msg, final Throwable tr) {
            mDate = date;
            mPriority = priority;
            mTag = tag;
            mMsg = msg;
            mTr = tr;
        }

        public Date getDate() {
            return mDate;
        }

        public String getDateString() {
            return FORMATTER.format(mDate);
        }

        public String getMsg() {
            return mMsg;
        }

        public int getPriority() {
            return mPriority;
        }

        public String getTag() {
            return mTag;
        }

        public Throwable getTr() {
            return mTr;
        }

        @Override
        public String toString() {
            String priority;
            switch (mPriority) {
                case Log.ASSERT:
                    priority = "ASSERT";
                    break;
                case Log.DEBUG:
                    priority = "DEBUG";
                    break;
                case Log.ERROR:
                    priority = "ERROR";
                    break;
                case Log.INFO:
                    priority = "INFO";
                case Log.WARN:
                    priority = "WARN";
                    break;
                case Log.VERBOSE:
                    priority = "VERBOSE";
                    break;
                default:
                    priority = "UNKNOWN";
            }

            String msg = mMsg;
            if (mTr != null) {
                final StringWriter sw = new StringWriter();
                final PrintWriter pw = new PrintWriter(sw);
                mTr.printStackTrace(pw);

                if (msg == null || msg.isEmpty())
                    msg = sw.toString();
                else
                    msg += "\n" + sw.toString();
            }

            return getDateString() + " " + priority + " " + getTag() + "\n" + msg;
        }
    }

    public static interface Receiver {
        void handle(Message message);
    }
}
