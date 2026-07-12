package com.chordex.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.os.Handler;
import android.os.Looper;

public class ForensicLogger {
    private static final String TAG = "STUDIO_STARTUP";
    private static final String PREFS_NAME = "StudioForensicLogs";
    private static final String LOG_KEY = "startup_logs";

    private Context context;
    
    // Watchdog state
    private String currentPhase = "unknown";
    private String lastCompletedPhase = "none";
    private boolean reactMounted = false;
    private boolean hubMounted = false;
    private boolean startupComplete = false;
    private String pendingPromises = "none";
    private String currentOpacity = "unknown";

    private static ForensicLogger instance;

    public static ForensicLogger getInstance(Context ctx) {
        if (instance == null) {
            instance = new ForensicLogger(ctx.getApplicationContext());
        }
        return instance;
    }

    private ForensicLogger(Context context) {
        this.context = context;
        logNative("ForensicLogger initialized");
    }

    @JavascriptInterface
    public void log(String message) {
        String fullMessage = "[STUDIO_STARTUP][JS] " + System.currentTimeMillis() + ": " + message;
        Log.e(TAG, fullMessage);
        writeToStorage(fullMessage);
    }
    
    @JavascriptInterface
    public void updateState(String currentPhase, String lastCompletedPhase, boolean reactMounted, boolean hubMounted, boolean startupComplete, String pendingPromises, String currentOpacity) {
        this.currentPhase = currentPhase;
        this.lastCompletedPhase = lastCompletedPhase;
        this.reactMounted = reactMounted;
        this.hubMounted = hubMounted;
        this.startupComplete = startupComplete;
        this.pendingPromises = pendingPromises;
        this.currentOpacity = currentOpacity;
    }

    public void logNative(String message) {
        String fullMessage = "[STUDIO_STARTUP][NATIVE] " + System.currentTimeMillis() + ": " + message;
        Log.e(TAG, fullMessage);
        writeToStorage(fullMessage);
    }

    private synchronized void writeToStorage(String message) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String existingLogs = prefs.getString(LOG_KEY, "");
        if (existingLogs.length() > 200000) {
            existingLogs = existingLogs.substring(existingLogs.length() - 100000);
        }
        prefs.edit().putString(LOG_KEY, existingLogs + "\n" + message).commit();
    }
    
    public void startWatchdog() {
        Handler handler = new Handler(Looper.getMainLooper());
        Runnable dumpState = new Runnable() {
            int count = 0;
            int[] delays = {2000, 5000, 10000};
            @Override
            public void run() {
                if (count < delays.length) {
                    logNative("WATCHDOG +" + (delays[count]/1000) + "s: phase=" + currentPhase + 
                        ", lastCompleted=" + lastCompletedPhase + 
                        ", reactMounted=" + reactMounted + 
                        ", hubMounted=" + hubMounted + 
                        ", startupComplete=" + startupComplete + 
                        ", pendingPromises=" + pendingPromises + 
                        ", currentOpacity=" + currentOpacity);
                    count++;
                    if (count < delays.length) {
                        handler.postDelayed(this, delays[count] - delays[count-1]);
                    }
                }
            }
        };
        handler.postDelayed(dumpState, 2000);
    }
}
