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
        if (context == null || uri == null) return false;
        String scheme = uri.getScheme();
        if (!"content".equalsIgnoreCase(scheme)) {
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
        ProviderInfo info = context.getPackageManager().resolveContentProvider(authority, 0);
        if (info == null || info.packageName.equals(packageName) || !info.exported) {
            return false;
        }
        return context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) == PackageManager.PERMISSION_GRANTED;
    }

    public static InputStream openSafeInputStream(Context context, Uri uri) throws IOException, SecurityException {
        if (context == null || uri == null) {
            return null;
        }
        String scheme = uri.getScheme();
        if (!"content".equalsIgnoreCase(scheme)) {
            throw new SecurityException("Only content:// URIs are supported: " + scheme);
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
        if (context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
            throw new SecurityException("Permission denied to read content URI: " + uri);
        }

        Uri safeUri = new Uri.Builder()
                .scheme("content")
                .authority(info.authority != null ? info.authority : authority)
                .encodedPath(uri.getEncodedPath())
                .encodedQuery(uri.getEncodedQuery())
                .encodedFragment(uri.getEncodedFragment())
                .build();

        return context.getContentResolver().openInputStream(safeUri);
    }
}
