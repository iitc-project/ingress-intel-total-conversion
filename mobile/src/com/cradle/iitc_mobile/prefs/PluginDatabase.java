package com.cradle.iitc_mobile.prefs;

import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteStatement;

import java.util.Hashtable;

import static android.app.SearchManager.SUGGEST_COLUMN_INTENT_EXTRA_DATA;
import static android.app.SearchManager.SUGGEST_COLUMN_QUERY;
import static android.app.SearchManager.SUGGEST_COLUMN_TEXT_1;

/**
 * SQLite database to store mappings of plugin names and their categories.
 * When search text is entered, it is matched to any plugin name that starts with the text.
 */
public class PluginDatabase extends SQLiteOpenHelper {
    private static final String DB_NAME = "plugins.sqlite", COL_ID = "_id", TABLE_SEARCH = "search";

    private static final int VERSION = 1;

    PluginDatabase(Context context) {
        super(context, DB_NAME, null, VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // Create the "search" table, which is a mapping of plugin titles and their category
        db.execSQL(String.format("create table %s ( _id integer primary key autoincrement, %s text, %s text, %s text)", TABLE_SEARCH, SUGGEST_COLUMN_TEXT_1, SUGGEST_COLUMN_QUERY, SUGGEST_COLUMN_INTENT_EXTRA_DATA));
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // implement schema changes and data massage here when upgrading
    }

    void addPlugins(Hashtable<String, String> pluginData) {
        SQLiteDatabase DB = getWritableDatabase();
        DB.beginTransaction();

        // Iterate through all keys from hash table to populate database table
        SQLiteStatement search = DB.compileStatement(String.format("insert into %s (%s, %s, %s) values (?, ?, ?);", TABLE_SEARCH, SUGGEST_COLUMN_TEXT_1, SUGGEST_COLUMN_QUERY, SUGGEST_COLUMN_INTENT_EXTRA_DATA));
        for(String title : pluginData.keySet()) {
            search.bindString(1, title);
            search.bindString(2, title);
            search.bindString(3, pluginData.get(title));
            search.executeInsert();
            search.clearBindings();
        }

        DB.setTransactionSuccessful();
        DB.endTransaction();
    }

    Cursor searchQuery(String arg) {
        String sql = String.format("SELECT %s, %s, %s, %s FROM %s WHERE %s like '%s%%'", COL_ID, SUGGEST_COLUMN_TEXT_1, SUGGEST_COLUMN_QUERY, SUGGEST_COLUMN_INTENT_EXTRA_DATA, TABLE_SEARCH, SUGGEST_COLUMN_TEXT_1, arg);
        Cursor c = getReadableDatabase().rawQuery(sql, null);

        if (c == null)
            return null;
        else if (!c.moveToFirst()) {
            c.close();
            return null;
        }
        return c;
    }

    // Return the number of entries in the database
    int pluginCount() {
        return (int) DatabaseUtils.queryNumEntries(getReadableDatabase(), TABLE_SEARCH);
    }
}
