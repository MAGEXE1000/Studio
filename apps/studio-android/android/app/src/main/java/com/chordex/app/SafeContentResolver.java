package com.chordex.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ProviderInfo;
import android.net.Uri;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;

public final class SafeContentResolver {
    private SafeContentResolver() {}

    public static boolean isSafeUri(Context context, Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (!"content".equalsIgnoreCase(scheme) && !"file".equalsIgnoreCase(scheme)) {
            return false;
        }
        String authority = uri.getAuthority();
        if (authority == null || authority.isEmpty()) {
            return false;
        }
        String packageName = context.getPackageName();
        if (authority.contains(packageName) || 
            authority.equalsIgnoreCase(packageName + ".fileprovider") || 
            authority.equalsIgnoreCase("com.chordex.app.fileprovider")) {
            return false;
        }
        if ("content".equalsIgnoreCase(scheme)) {
            if (context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
            ProviderInfo info = context.getPackageManager().resolveContentProvider(authority, 0);
            if (info == null || info.packageName.equals(packageName) || !info.exported) {
                return false;
            }
        }
        return true;
    }

    public static InputStream openSafeInputStream(Context context, Uri uri) throws IOException, SecurityException {
        if (uri == null) {
            return null;
        }
        String scheme = uri.getScheme();
        if ("content".equalsIgnoreCase(scheme)) {
            if (context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                throw new SecurityException("Permission denied to read content URI: " + uri);
            }
            String authority = uri.getAuthority();
            if (authority == null || authority.isEmpty()) {
                throw new SecurityException("Missing URI authority: " + uri);
            }
            String packageName = context.getPackageName();
            if (authority.contains(packageName) || 
                authority.equalsIgnoreCase(packageName + ".fileprovider") || 
                authority.equalsIgnoreCase("com.chordex.app.fileprovider")) {
                throw new SecurityException("Access to internal app file provider blocked: " + authority);
            }
            ProviderInfo info = context.getPackageManager().resolveContentProvider(authority, 0);
            if (info == null || info.packageName.equals(packageName) || !info.exported) {
                throw new SecurityException("Blocked resolution of unexported/internal content provider: " + authority);
            }
            return context.getContentResolver().openInputStream(uri);
        } else if ("file".equalsIgnoreCase(scheme)) {
            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                throw new SecurityException("Invalid file path in URI: " + uri);
            }
            File file = new File(path);
            if (!file.exists() || !file.canRead()) {
                throw new SecurityException("File does not exist or cannot be read: " + path);
            }
            return new FileInputStream(file);
        }
        throw new SecurityException("Unsupported URI scheme: " + scheme);
    }
}
