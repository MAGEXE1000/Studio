package com.chordex.app;

import android.app.Application;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        ForensicLogger.getInstance(this).logNative("Application.onCreate");
    }
}
