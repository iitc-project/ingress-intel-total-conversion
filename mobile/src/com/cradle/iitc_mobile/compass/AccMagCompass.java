package com.cradle.iitc_mobile.compass;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class AccMagCompass extends Compass {
    private static final double SENSOR_DELAY_USER = 100 * 1e6; // 100 milliseconds

    private final Context mContext;
    private long mLastUpdate = 0;
    private final SensorListener mListener = new SensorListener();
    private final float[] mOrientation = new float[3];
    private final float[] mRotationMatrix = new float[9];
    private final Sensor mSensorAcc, mSensorMag;
    private final SensorManager mSensorManager;
    private float[] mValuesAcc = null, mValuesMag = null;

    public AccMagCompass(final Context context) {
        mContext = context;

        mSensorManager = (SensorManager) mContext.getSystemService(Context.SENSOR_SERVICE);

        mSensorAcc = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        mSensorMag = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
    }

    private void calculateOrientation() {

        // wait until both sensors have given us an event
        if (mValuesAcc == null || mValuesMag == null) return;

        if (!SensorManager.getRotationMatrix(mRotationMatrix, null, mValuesAcc, mValuesMag)) return;
        SensorManager.getOrientation(mRotationMatrix, mOrientation);

        publishOrientation(mOrientation[0], mOrientation[1], mOrientation[2]);
    }

    @Override
    protected void onStart() {
        mSensorManager.registerListener(mListener, mSensorAcc, SensorManager.SENSOR_DELAY_NORMAL);
        mSensorManager.registerListener(mListener, mSensorMag, SensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    protected void onStop() {
        mSensorManager.unregisterListener(mListener);
    }

    private class SensorListener implements SensorEventListener {
        @Override
        public void onAccuracyChanged(final Sensor sensor, final int accuracy) {
        }

        @Override
        public void onSensorChanged(final SensorEvent event) {
            switch (event.sensor.getType()) {
                case Sensor.TYPE_ACCELEROMETER:
                    mValuesAcc = event.values;
                    break;
                case Sensor.TYPE_MAGNETIC_FIELD:
                    mValuesMag = event.values;

                    // save some battery, 10 updates per second should be enough
                    if ((event.timestamp - mLastUpdate) < SENSOR_DELAY_USER) break;
                    mLastUpdate = event.timestamp;

                    calculateOrientation();
            }
        }
    }
}
