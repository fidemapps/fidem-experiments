package com.fidemapps.demo.mobile;

import android.app.Activity;

/**
 * Created by cgu on 15-06-17.
 */

public class StartupActivity extends Activity {
    @Override
    protected void onResume() {
        super.onResume();

        if (!GimbalHelper.getInstance().getIsGimbalServiceRunning()) {

            GimbalHelper.getInstance().startGimbalService();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        // shutdown service if it is running
        GimbalHelper.getInstance().stopGimbalService();
    }
}