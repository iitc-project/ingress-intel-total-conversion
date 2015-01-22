package com.cradle.iitc_mobile.compass;

import java.util.ArrayList;

public abstract class Compass
{
    private final ArrayList<CompassListener> mListeners = new ArrayList<CompassListener>();
    private boolean mStarted = false;

    protected void publishOrientation(final float x, final float y, final float z)
    {
        for (final CompassListener listener : mListeners)
            listener.onCompassChanged(x, y, z);
    }

    protected abstract void onStart();

    protected abstract void onStop();

    public void registerListener(final CompassListener listener)
    {
        mListeners.add(listener);
        if (!mStarted)
        {
            onStart();
            mStarted = true;
        }
    }

    public void unregisterListener(final CompassListener listener)
    {
        mListeners.remove(listener);
        if (mListeners.size() == 0)
        {
            onStop();
            mStarted = false;
        }
    }
}
