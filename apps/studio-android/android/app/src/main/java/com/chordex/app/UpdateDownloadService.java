package com.chordex.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;

public class UpdateDownloadService extends Service {
    private static final String TAG = "UpdateDownloadService";
    private static final String CHANNEL_ID = "studio_update_download";
    private static final String CHANNEL_NAME = "Studio update downloader";
    private static final int NOTIFICATION_ID = 2026;

    private NotificationManager notificationManager;
    private NotificationCompat.Builder notificationBuilder;
    private boolean isDownloading = false;

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(CHANNEL_ID);
            if (channel == null) {
                channel = new NotificationChannel(
                    CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("Shows progress for downloading updates.");
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String url = intent.getStringExtra("url");
        String fileName = intent.getStringExtra("fileName");
        String expectedHash = intent.getStringExtra("expectedHash");

        if (url == null || isDownloading) {
            stopSelf();
            return START_NOT_STICKY;
        }

        isDownloading = true;
        startForegroundNotification();

        new Thread(() -> {
            try {
                File apkFile = downloadFile(url, fileName);
                
                // Complete download -> proceed to verify
                updateProgressNotification("Verifying update...", 100, true);
                
                boolean verified = verifySha256(apkFile, expectedHash);
                if (verified) {
                    updateProgressNotification("Preparing installation...", 100, true);
                    
                    // Trigger native package installer session
                    if (AppInstallerPlugin.instance != null) {
                        AppInstallerPlugin.instance.getActivity().runOnUiThread(() -> {
                            try {
                                AppInstallerPlugin.instance.triggerInstallation(apkFile, null);
                            } catch (Exception e) {
                                Log.e(TAG, "Failed to trigger installation", e);
                                updateProgressNotification("Installation failed", 0, false);
                            }
                        });
                    }

                    // Resolve the pending Capacitor PluginCall to inform JS that download/verification is complete
                    if (AppInstallerPlugin.activeDownloadCall != null) {
                        JSObject ret = new JSObject();
                        ret.put("filePath", apkFile.getAbsolutePath());
                        AppInstallerPlugin.activeDownloadCall.resolve(ret);
                        AppInstallerPlugin.activeDownloadCall = null;
                    }
                    
                    updateProgressNotification("Ready to install", 100, false);
                } else {
                    updateProgressNotification("Verification failed (SHA mismatch)", 0, false);
                    if (AppInstallerPlugin.instance != null) {
                        JSObject err = new JSObject();
                        err.put("error", "SHA mismatch");
                        AppInstallerPlugin.instance.emitInstallStatus(err);
                    }
                    if (AppInstallerPlugin.activeDownloadCall != null) {
                        AppInstallerPlugin.activeDownloadCall.reject("SHA mismatch");
                        AppInstallerPlugin.activeDownloadCall = null;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Download failed", e);
                updateProgressNotification("Download failed: " + e.getMessage(), 0, false);
                if (AppInstallerPlugin.instance != null) {
                    JSObject err = new JSObject();
                    err.put("error", e.getMessage());
                    AppInstallerPlugin.instance.emitInstallStatus(err);
                }
                if (AppInstallerPlugin.activeDownloadCall != null) {
                    AppInstallerPlugin.activeDownloadCall.reject("Download failed: " + e.getMessage(), e);
                    AppInstallerPlugin.activeDownloadCall = null;
                }
            } finally {
                isDownloading = false;
                stopForeground(false);
                stopSelf();
            }
        }).start();

        return START_REDELIVER_INTENT;
    }

    private void startForegroundNotification() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = null;
        if (launch != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            pi = PendingIntent.getActivity(this, 0, launch, flags);
        }

        notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Downloading Studio Update")
            .setContentText("Connecting...")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setOngoing(true)
            .setProgress(100, 0, true);
        if (pi != null) {
            notificationBuilder.setContentIntent(pi);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notificationBuilder.build(), 
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notificationBuilder.build());
        }
    }

    private void updateProgressNotification(String text, int progress, boolean indeterminate) {
        if (notificationBuilder != null) {
            notificationBuilder.setContentText(text)
                .setProgress(100, progress, indeterminate);
            if (!isDownloading) {
                notificationBuilder.setOngoing(false);
                notificationBuilder.setSmallIcon(android.R.drawable.stat_sys_download_done);
            }
            notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
        }

        // Also notify UI over capacitor listener if app is active
        if (AppInstallerPlugin.instance != null) {
            JSObject state = new JSObject();
            state.put("status", text);
            state.put("progress", progress);
            AppInstallerPlugin.instance.emitInstallStatus(state);
        }
    }

    private File downloadFile(String urlString, String fileName) throws Exception {
        BufferedInputStream input = null;
        RandomAccessFile output = null;
        HttpURLConnection connection = null;
        try {
            File cacheDir = getExternalCacheDir();
            if (cacheDir == null) {
                cacheDir = getCacheDir();
            }
            if (fileName == null || fileName.isEmpty()) {
                fileName = "update.apk";
            }
            File apkFile = new File(cacheDir, fileName);
            long existingLength = 0;
            if (apkFile.exists()) {
                existingLength = apkFile.length();
            }

            URL url = new URL(urlString);
            connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(true);

            if (existingLength > 0) {
                connection.setRequestProperty("Range", "bytes=" + existingLength + "-");
            }

            int redirectCount = 0;
            int status = connection.getResponseCode();
            while ((status == HttpURLConnection.HTTP_MOVED_TEMP
                    || status == HttpURLConnection.HTTP_MOVED_PERM
                    || status == 301 || status == 302 || status == 307 || status == 308)
                    && redirectCount < 8) {
                String newUrl = connection.getHeaderField("Location");
                if (newUrl == null) break;
                url = new URL(newUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                if (existingLength > 0) {
                    connection.setRequestProperty("Range", "bytes=" + existingLength + "-");
                }
                status = connection.getResponseCode();
                redirectCount++;
            }

            boolean isResume = (status == 206);
            if (status != HttpURLConnection.HTTP_OK && !isResume) {
                if (existingLength > 0) {
                    apkFile.delete();
                    existingLength = 0;
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(true);
                    status = connection.getResponseCode();
                    if (status != HttpURLConnection.HTTP_OK) {
                        throw new Exception("Server returned non-OK status: " + status);
                    }
                } else {
                    throw new Exception("Server returned non-OK status: " + status);
                }
            }

            long totalBytesRead = isResume ? existingLength : 0;
            long fileLength = connection.getContentLength();
            if (fileLength > 0) {
                fileLength += totalBytesRead;
            }

            input = new BufferedInputStream(connection.getInputStream());
            output = new RandomAccessFile(apkFile, "rw");
            if (isResume) {
                output.seek(existingLength);
            } else {
                output.setLength(0);
            }

            byte[] data = new byte[8192];
            int count;
            int lastProgress = 0;

            while ((count = input.read(data)) != -1) {
                totalBytesRead += count;
                output.write(data, 0, count);
                if (fileLength > 0) {
                    int progress = (int) (totalBytesRead * 100 / fileLength);
                    if (progress > lastProgress) {
                        lastProgress = progress;
                        updateProgressNotification("Downloading... " + progress + "%", progress, false);
                    }
                }
            }

            return apkFile;
        } finally {
            if (output != null) output.close();
            if (input != null) input.close();
            if (connection != null) connection.disconnect();
        }
    }

    private boolean verifySha256(File file, String expectedHash) {
        if (expectedHash == null || expectedHash.isEmpty()) return true;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            java.io.InputStream fis = new java.io.FileInputStream(file);
            byte[] buffer = new byte[8192];
            int count;
            while ((count = fis.read(buffer)) > 0) {
                digest.update(buffer, 0, count);
            }
            fis.close();
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(expectedHash);
        } catch (Exception e) {
            return false;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
