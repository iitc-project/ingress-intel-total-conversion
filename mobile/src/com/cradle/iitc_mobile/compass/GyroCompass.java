/************************************************************************************
 * Copyright (c) 2012 Paul Lawitzki
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 ************************************************************************************/

package com.cradle.iitc_mobile.compass;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;

import java.util.Timer;
import java.util.TimerTask;

public class GyroCompass extends Compass
{
    private static final float EPSILON = 0.000000001f;
    private static final float FILTER_COEFFICIENT = 0.98f;
    private static final float NS2S = 1.0f / 1000000000.0f;
    private static final int TIME_CONSTANT = 30;

    private final AccMagCompass mAccMagCompass;
    private final AccMagListener mAccMagListener = new AccMagListener();
    // orientation angles from accel and magnet
    private float[] mAccMagOrientation = null;
    private final Context mContext;
    // final orientation angles from sensor fusion
    private final float[] mFusedOrientation = new float[3];
    private final Timer mFuseTimer = new Timer();
    // angular speeds from gyro
    private final float[] mGyro = new float[3];
    // rotation matrix from gyro data
    private float[] mGyroMatrix = null;
    // orientation angles from gyro matrix
    private final float[] mGyroOrientation = { 0, 0, 0 };
    private final Sensor mSensor;

    private final SensorListener mSensorListener = new SensorListener();
    private SensorManager mSensorManager = null;
    private FuseOrientationTask mTask;
    private long mTimestamp;
    private final Runnable mUpdateRunnable = new Runnable()
    {
        @Override
        public void run()
        {
            publishOrientation(mFusedOrientation[0], mFusedOrientation[1], mFusedOrientation[2]);
        }
    };

    public GyroCompass(final Context context)
    {
        this(context, new AccMagCompass(context));
    }

    public GyroCompass(final Context context, final AccMagCompass compass)
    {
        super();

        mContext = context;
        mAccMagCompass = compass;

        // get sensorManager and initialise sensor listeners
        mSensorManager = (SensorManager) mContext.getSystemService(Context.SENSOR_SERVICE);
        mSensor = mSensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
    }

    private float[] getRotationMatrixFromOrientation(final float[] o)
    {
        final float[] xM = new float[9];
        final float[] yM = new float[9];
        final float[] zM = new float[9];

        final float sinX = (float) Math.sin(o[1]);
        final float cosX = (float) Math.cos(o[1]);
        final float sinY = (float) Math.sin(o[2]);
        final float cosY = (float) Math.cos(o[2]);
        final float sinZ = (float) Math.sin(o[0]);
        final float cosZ = (float) Math.cos(o[0]);

        // rotation about x-axis (pitch)
        xM[0] = 1.0f;
        xM[1] = 0.0f;
        xM[2] = 0.0f;
        xM[3] = 0.0f;
        xM[4] = cosX;
        xM[5] = sinX;
        xM[6] = 0.0f;
        xM[7] = -sinX;
        xM[8] = cosX;

        // rotation about y-axis (roll)
        yM[0] = cosY;
        yM[1] = 0.0f;
        yM[2] = sinY;
        yM[3] = 0.0f;
        yM[4] = 1.0f;
        yM[5] = 0.0f;
        yM[6] = -sinY;
        yM[7] = 0.0f;
        yM[8] = cosY;

        // rotation about z-axis (azimuth)
        zM[0] = cosZ;
        zM[1] = sinZ;
        zM[2] = 0.0f;
        zM[3] = -sinZ;
        zM[4] = cosZ;
        zM[5] = 0.0f;
        zM[6] = 0.0f;
        zM[7] = 0.0f;
        zM[8] = 1.0f;

        // rotation order is y, x, z (roll, pitch, azimuth)
        float[] resultMatrix = matrixMultiplication(xM, yM);
        resultMatrix = matrixMultiplication(zM, resultMatrix);
        return resultMatrix;
    }

    // This function is borrowed from the Android reference
    // at http://developer.android.com/reference/android/hardware/SensorEvent.html#values
    // It calculates a rotation vector from the gyroscope angular speed values.
    private void getRotationVectorFromGyro(final float[] values, final float[] deltaRotationVector, final float time)
    {
        final float[] normValues = new float[3];

        // Calculate the angular speed of the sample
        final float omegaMagnitude =
                (float) Math.sqrt(values[0] * values[0] + values[1] * values[1] + values[2] * values[2]);

        // Normalize the rotation vector if it's big enough to get the axis
        if (omegaMagnitude > EPSILON)
        {
            normValues[0] = values[0] / omegaMagnitude;
            normValues[1] = values[1] / omegaMagnitude;
            normValues[2] = values[2] / omegaMagnitude;
        }

        // Integrate around this axis with the angular speed by the timestep
        // in order to get a delta rotation from this sample over the timestep
        // We will convert this axis-angle representation of the delta rotation
        // into a quaternion before turning it into the rotation matrix.
        final float thetaOverTwo = omegaMagnitude * time;
        final float sinThetaOverTwo = (float) Math.sin(thetaOverTwo);
        final float cosThetaOverTwo = (float) Math.cos(thetaOverTwo);
        deltaRotationVector[0] = sinThetaOverTwo * normValues[0];
        deltaRotationVector[1] = sinThetaOverTwo * normValues[1];
        deltaRotationVector[2] = sinThetaOverTwo * normValues[2];
        deltaRotationVector[3] = cosThetaOverTwo;
    }

    private float[] matrixMultiplication(final float[] A, final float[] B)
    {
        final float[] result = new float[9];

        result[0] = A[0] * B[0] + A[1] * B[3] + A[2] * B[6];
        result[1] = A[0] * B[1] + A[1] * B[4] + A[2] * B[7];
        result[2] = A[0] * B[2] + A[1] * B[5] + A[2] * B[8];

        result[3] = A[3] * B[0] + A[4] * B[3] + A[5] * B[6];
        result[4] = A[3] * B[1] + A[4] * B[4] + A[5] * B[7];
        result[5] = A[3] * B[2] + A[4] * B[5] + A[5] * B[8];

        result[6] = A[6] * B[0] + A[7] * B[3] + A[8] * B[6];
        result[7] = A[6] * B[1] + A[7] * B[4] + A[8] * B[7];
        result[8] = A[6] * B[2] + A[7] * B[5] + A[8] * B[8];

        return result;
    }

    // This function performs the integration of the gyroscope data.
    // It writes the gyroscope based orientation into gyroOrientation.
    private void onGyroChanged(final SensorEvent event)
    {
        // don't start until first accelerometer/magnetometer orientation has been acquired
        if (mAccMagOrientation == null)
            return;

        // initialisation of the gyroscope based rotation matrix
        if (mGyroMatrix == null)
            mGyroMatrix = getRotationMatrixFromOrientation(mAccMagOrientation);

        // copy the new gyro values into the gyro array
        // convert the raw gyro data into a rotation vector
        final float[] deltaVector = new float[4];
        if (mTimestamp != 0)
        {
            final float dT = (event.timestamp - mTimestamp) * NS2S;
            System.arraycopy(event.values, 0, mGyro, 0, 3);
            getRotationVectorFromGyro(mGyro, deltaVector, dT / 2.0f);
        }

        // measurement done, save current time for next interval
        mTimestamp = event.timestamp;

        // convert rotation vector into rotation matrix
        final float[] deltaMatrix = new float[9];
        SensorManager.getRotationMatrixFromVector(deltaMatrix, deltaVector);

        // apply the new rotation interval on the gyroscope based rotation matrix
        mGyroMatrix = matrixMultiplication(mGyroMatrix, deltaMatrix);

        // get the gyroscope based orientation from the rotation matrix
        SensorManager.getOrientation(mGyroMatrix, mGyroOrientation);
    }

    @Override
    protected void onStart()
    {
        // restore the sensor listeners when user resumes the application.
        mSensorManager.registerListener(mSensorListener, mSensor, SensorManager.SENSOR_DELAY_UI);
        mAccMagCompass.registerListener(mAccMagListener);

        mTask = new FuseOrientationTask();
        mFuseTimer.scheduleAtFixedRate(mTask, 200, TIME_CONSTANT);
    }

    @Override
    protected void onStop()
    {
        mSensorManager.unregisterListener(mSensorListener);
        mAccMagCompass.unregisterListener(mAccMagListener);
        mTask.cancel();
    }

    private class AccMagListener implements CompassListener
    {
        @Override
        public void onCompassChanged(final float x, final float y, final float z)
        {
            if (mAccMagOrientation == null)
            {
                mGyroOrientation[0] = x;
                mGyroOrientation[1] = y;
                mGyroOrientation[2] = z;
            }
            mAccMagOrientation = new float[] { x, y, z };

        }
    }

    private class FuseOrientationTask extends TimerTask
    {
        private final Handler mHandler = new Handler();

        @Override
        public void run()
        {
            if (mAccMagOrientation == null)
                return;

            final float oneMinusCoeff = 1.0f - FILTER_COEFFICIENT;

            /*
             * Fix for 179° <--> -179° transition problem:
             * Check whether one of the two orientation angles (gyro or accMag) is negative while the
             * other one is positive.
             * If so, add 360° (2 * math.PI) to the negative value, perform the sensor fusion, and remove
             * the 360° from the result
             * if it is greater than 180°. This stabilizes the output in positive-to-negative-transition
             * cases.
             */

            // azimuth
            if (mGyroOrientation[0] < -0.5 * Math.PI && mAccMagOrientation[0] > 0.0)
            {
                mFusedOrientation[0] = (float) (FILTER_COEFFICIENT *
                        (mGyroOrientation[0] + 2.0 * Math.PI) + oneMinusCoeff * mAccMagOrientation[0]);
                mFusedOrientation[0] -= (mFusedOrientation[0] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else if (mAccMagOrientation[0] < -0.5 * Math.PI && mGyroOrientation[0] > 0.0)
            {
                mFusedOrientation[0] = (float) (FILTER_COEFFICIENT * mGyroOrientation[0] +
                        oneMinusCoeff * (mAccMagOrientation[0] + 2.0 * Math.PI));
                mFusedOrientation[0] -= (mFusedOrientation[0] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else
            {
                mFusedOrientation[0] = FILTER_COEFFICIENT * mGyroOrientation[0] +
                        oneMinusCoeff * mAccMagOrientation[0];
            }

            // pitch
            if (mGyroOrientation[1] < -0.5 * Math.PI && mAccMagOrientation[1] > 0.0)
            {
                mFusedOrientation[1] = (float) (FILTER_COEFFICIENT *
                        (mGyroOrientation[1] + 2.0 * Math.PI) + oneMinusCoeff * mAccMagOrientation[1]);
                mFusedOrientation[1] -= (mFusedOrientation[1] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else if (mAccMagOrientation[1] < -0.5 * Math.PI && mGyroOrientation[1] > 0.0)
            {
                mFusedOrientation[1] = (float) (FILTER_COEFFICIENT * mGyroOrientation[1] +
                        oneMinusCoeff * (mAccMagOrientation[1] + 2.0 * Math.PI));
                mFusedOrientation[1] -= (mFusedOrientation[1] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else
            {
                mFusedOrientation[1] = FILTER_COEFFICIENT * mGyroOrientation[1] +
                        oneMinusCoeff * mAccMagOrientation[1];
            }

            // roll
            if (mGyroOrientation[2] < -0.5 * Math.PI && mAccMagOrientation[2] > 0.0)
            {
                mFusedOrientation[2] = (float) (FILTER_COEFFICIENT *
                        (mGyroOrientation[2] + 2.0 * Math.PI) + oneMinusCoeff * mAccMagOrientation[2]);
                mFusedOrientation[2] -= (mFusedOrientation[2] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else if (mAccMagOrientation[2] < -0.5 * Math.PI && mGyroOrientation[2] > 0.0)
            {
                mFusedOrientation[2] = (float) (FILTER_COEFFICIENT * mGyroOrientation[2] +
                        oneMinusCoeff * (mAccMagOrientation[2] + 2.0 * Math.PI));
                mFusedOrientation[2] -= (mFusedOrientation[2] > Math.PI) ? 2.0 * Math.PI : 0;
            }
            else
            {
                mFusedOrientation[2] = FILTER_COEFFICIENT * mGyroOrientation[2] +
                        oneMinusCoeff * mAccMagOrientation[2];
            }

            // overwrite gyro matrix and orientation with fused orientation
            // to comensate gyro drift
            mGyroMatrix = getRotationMatrixFromOrientation(mFusedOrientation);
            System.arraycopy(mFusedOrientation, 0, mGyroOrientation, 0, 3);

            // update sensor output in GUI
            mHandler.post(mUpdateRunnable);
        }
    }

    private class SensorListener implements SensorEventListener
    {
        @Override
        public void onAccuracyChanged(final Sensor sensor, final int accuracy)
        {
        }

        @Override
        public void onSensorChanged(final SensorEvent event)
        {
            onGyroChanged(event);
        }
    }
}
