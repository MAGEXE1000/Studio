package com.chordex.app;

import android.content.Context;
import android.os.Environment;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.os.Handler;
import android.os.Looper;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.FileInputStream;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ForensicLogger {
    private static final String TAG = "STUDIO_STARTUP";
    private static ForensicLogger instance;
    private Context context;
    
    private File baseDir;
    private File startupDir;
    private File crashDir;
    private File updatesDir;
    private File logsDir;
    private File diagnosticsDir;
    private File sessionsDir;

    private File currentStartupLog;
    private File currentSessionJson;
    private File currentUpdatesLog;
    private File currentAppLog;
    
    private String sessionTimestamp;

    // Watchdog state
    private String currentPhase = "unknown";
    private String lastCompletedPhase = "none";
    private boolean reactMounted = false;
    private boolean hubMounted = false;
    private boolean startupComplete = false;
    private String pendingPromises = "none";
    private String currentOpacity = "unknown";

    public static ForensicLogger getInstance(Context ctx) {
        if (instance == null) {
            instance = new ForensicLogger(ctx.getApplicationContext());
        }
        return instance;
    }

    private ForensicLogger(Context context) {
        this.context = context;
        initDirectories();
        setupUncaughtExceptionHandler();
        startNewSession();
        cleanupOldFiles();
        logNative("ForensicLogger initialized");
    }

    private void initDirectories() {
        File docsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
        baseDir = new File(docsDir, "Studio");
        startupDir = new File(baseDir, "Startup");
        crashDir = new File(baseDir, "CrashReports");
        updatesDir = new File(baseDir, "Updates");
        logsDir = new File(baseDir, "Logs");
        diagnosticsDir = new File(baseDir, "Diagnostics");
        sessionsDir = new File(baseDir, "Sessions");

        File[] dirs = {baseDir, startupDir, crashDir, updatesDir, logsDir, diagnosticsDir, sessionsDir};
        for (File dir : dirs) {
            if (!dir.exists()) {
                dir.mkdirs();
            }
        }
    }

    private void startNewSession() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US);
        sessionTimestamp = sdf.format(new Date());
        
        currentStartupLog = new File(startupDir, "startup_" + sessionTimestamp + ".log");
        currentSessionJson = new File(sessionsDir, "session_" + sessionTimestamp + ".json");
        currentUpdatesLog = new File(updatesDir, "update_" + sessionTimestamp + ".log");
        currentAppLog = new File(logsDir, "app_" + sessionTimestamp + ".log");
        
        try {
            if (!currentStartupLog.exists()) currentStartupLog.createNewFile();
            if (!currentSessionJson.exists()) currentSessionJson.createNewFile();
            if (!currentUpdatesLog.exists()) currentUpdatesLog.createNewFile();
            if (!currentAppLog.exists()) currentAppLog.createNewFile();
        } catch (IOException e) {
            Log.e(TAG, "Failed to create session files", e);
        }
    }

    private void setupUncaughtExceptionHandler() {
        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                try {
                    File crashFile = new File(crashDir, "crash_" + new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(new Date()) + ".log");
                    FileOutputStream fos = new FileOutputStream(crashFile, true);
                    String crashMsg = "FATAL NATIVE EXCEPTION in thread " + thread.getName() + "\n" + throwable.toString() + "\n";
                    fos.write(crashMsg.getBytes());
                    for (StackTraceElement element : throwable.getStackTrace()) {
                        fos.write(("\tat " + element.toString() + "\n").getBytes());
                    }
                    fos.flush();
                    fos.close();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to write crash log", e);
                }
                if (defaultHandler != null) {
                    defaultHandler.uncaughtException(thread, throwable);
                } else {
                    System.exit(2);
                }
            }
        });
    }

    @JavascriptInterface
    public void log(String category, String message) {
        String fullMessage = "[STUDIO_STARTUP][JS] " + System.currentTimeMillis() + ": " + message;
        Log.e(TAG, fullMessage);
        
        if (category != null) {
            if (category.equalsIgnoreCase("NATIVE") || category.equalsIgnoreCase("UPDATER")) {
                appendToFile(currentUpdatesLog, fullMessage + "\n");
            } else if (category.equalsIgnoreCase("CRASH") || category.equalsIgnoreCase("ERROR") || category.equalsIgnoreCase("FATAL")) {
                try {
                    File crashFile = new File(crashDir, "crash_" + new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(new Date()) + ".log");
                    appendToFile(crashFile, fullMessage + "\n");
                } catch (Exception e) {}
            } else {
                appendToFile(currentAppLog, fullMessage + "\n");
            }
        }
        
        // Always write to startup log for complete trace
        appendToFile(currentStartupLog, fullMessage + "\n");
    }

    @JavascriptInterface
    public void logJson(String jsonStr) {
        appendToFile(currentSessionJson, jsonStr + "\n");
    }

    @JavascriptInterface
    public void exportCurrentSession(String reason) {
        logNative("Session auto-exported/finalized due to: " + reason);
        // We write synchronously, so nothing explicitly needs flushing here.
        // We generate a crash-zip here if it's a fatal error or stall.
        if (reason != null && (reason.toLowerCase().contains("fatal") || reason.toLowerCase().contains("timeout") || reason.toLowerCase().contains("stall") || reason.toLowerCase().contains("missing"))) {
            exportZip();
        }
    }

    @JavascriptInterface
    public String exportZip() {
        try {
            File zipFile = new File(diagnosticsDir, "diagnostics_" + new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(new Date()) + ".zip");
            FileOutputStream fos = new FileOutputStream(zipFile);
            ZipOutputStream zos = new ZipOutputStream(fos);

            File[] allDirs = {startupDir, crashDir, updatesDir, logsDir, sessionsDir};
            for (File dir : allDirs) {
                if (dir.exists() && dir.isDirectory()) {
                    File[] files = dir.listFiles();
                    if (files != null) {
                        for (File file : files) {
                            if (file.isFile()) {
                                addFileToZip(file, dir.getName() + "/" + file.getName(), zos);
                            }
                        }
                    }
                }
            }
            zos.close();
            fos.close();
            return zipFile.getAbsolutePath();
        } catch (Exception e) {
            Log.e(TAG, "Failed to export ZIP", e);
            return null;
        }
    }

    private void addFileToZip(File file, String zipPath, ZipOutputStream zos) throws IOException {
        FileInputStream fis = new FileInputStream(file);
        ZipEntry zipEntry = new ZipEntry(zipPath);
        zos.putNextEntry(zipEntry);
        byte[] bytes = new byte[1024];
        int length;
        while ((length = fis.read(bytes)) >= 0) {
            zos.write(bytes, 0, length);
        }
        zos.closeEntry();
        fis.close();
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
        appendToFile(currentStartupLog, fullMessage + "\n");
        appendToFile(currentAppLog, fullMessage + "\n");
    }

    private synchronized void appendToFile(File file, String content) {
        if (file == null) return;
        try {
            FileOutputStream fos = new FileOutputStream(file, true);
            fos.write(content.getBytes());
            fos.flush();
            fos.close();
        } catch (IOException e) {
            Log.e(TAG, "Failed to write to forensic log", e);
        }
    }

    private void cleanupOldFiles() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                trimDirectory(startupDir, 100);
                trimDirectory(crashDir, 100);
                trimDirectory(updatesDir, 100);
                trimDirectory(logsDir, 100);
                trimDirectory(sessionsDir, 100);
                trimDirectory(diagnosticsDir, 30);
            }
        }).start();
    }

    private void trimDirectory(File dir, int maxFiles) {
        if (!dir.exists() || !dir.isDirectory()) return;
        File[] files = dir.listFiles();
        if (files == null || files.length <= maxFiles) return;

        Arrays.sort(files, new java.util.Comparator<File>() {
            @Override
            public int compare(File f1, File f2) {
                return Long.compare(f2.lastModified(), f1.lastModified()); // newest first
            }
        });
        
        for (int i = maxFiles; i < files.length; i++) {
            files[i].delete();
        }
    }
    
    @JavascriptInterface
    public String getLatestFilePath(String type) {
        File dir = null;
        if (type.equalsIgnoreCase("startup")) dir = startupDir;
        else if (type.equalsIgnoreCase("crash")) dir = crashDir;
        else if (type.equalsIgnoreCase("update")) dir = updatesDir;
        else if (type.equalsIgnoreCase("log")) dir = logsDir;
        
        if (dir == null || !dir.exists()) return null;
        File[] files = dir.listFiles();
        if (files == null || files.length == 0) return null;
        
        Arrays.sort(files, new java.util.Comparator<File>() {
            public int compare(File f1, File f2) {
                return Long.compare(f2.lastModified(), f1.lastModified());
            }
        });
        return "file://" + files[0].getAbsolutePath();
    }

    @JavascriptInterface
    public String readLatestFileContent(String type) {
        String pathStr = getLatestFilePath(type);
        if (pathStr == null) return null;
        String path = pathStr.replace("file://", "");
        try {
            FileInputStream fis = new FileInputStream(new File(path));
            byte[] bytes = new byte[fis.available()];
            fis.read(bytes);
            fis.close();
            return new String(bytes);
        } catch (Exception e) {
            return null;
        }
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
