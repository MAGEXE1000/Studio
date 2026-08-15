package com.chordex.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ProviderInfo;
import android.net.Uri;
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
        if (!"content".equalsIgnoreCase(scheme) && !"file".equalsIgnoreCase(scheme)) {
            throw new SecurityException("Unsupported URI scheme: " + scheme);
        }
        String authority = uri.getAuthority();
        if (authority == null || authority.isEmpty()) {
            throw new SecurityException("Missing URI authority");
        }
        String packageName = context.getPackageName();
        if (authority.contains(packageName) || 
            authority.equalsIgnoreCase(packageName + ".fileprovider") || 
            authority.equalsIgnoreCase("com.chordex.app.fileprovider")) {
            throw new SecurityException("Access to internal app file provider blocked.");
        }
        if ("content".equalsIgnoreCase(scheme)) {
            ProviderInfo info = context.getPackageManager().resolveContentProvider(authority, 0);
            if (info == null || info.packageName.equals(packageName) || !info.exported) {
                throw new SecurityException("Blocked resolution of unexported/internal content provider.");
            }
            if (context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                throw new SecurityException("Permission denied to read content URI.");
            }
        }
        return context.getContentResolver().openInputStream(uri);
    }
}
