package com.fidemapps.demo.mobile;
import android.app.Application;


public class MyApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        GimbalHelper.getInstance().setApplication(this);
    }
}
