package com.chordex.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ProviderInfo;
import android.net.Uri;
import java.io.InputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public final class SafeContentResolver {
    private SafeContentResolver() {}

    private static final Set<String> ALLOWED_SYSTEM_AUTHORITIES = new HashSet<>(Arrays.asList(
            "media",
            "com.android.providers.media.documents",
            "com.android.externalstorage.documents",
            "com.android.providers.downloads.documents",
            "com.google.android.apps.docs.storage",
            "com.google.android.apps.docs.files"
    ));

    public static boolean isAllowedAuthority(String authority) {
        if (authority == null || authority.isEmpty()) {
            return false;
        }
        return ALLOWED_SYSTEM_AUTHORITIES.contains(authority) || 
               (!authority.contains("com.chordex.app") && 
                !authority.contains("fileprovider") && 
                !authority.equals("com.chordex.app.fileprovider"));
    }

    public static boolean isSafeUri(Context context, Uri uri) {
        if (context == null || uri == null) return false;
        String scheme = uri.getScheme();
        if (!"content".equalsIgnoreCase(scheme)) {
            return false;
        }
        String authority = uri.getAuthority();
        if (authority == null || !isAllowedAuthority(authority)) {
            return false;
        }
        String packageName = context.getPackageName();
        if (authority.contains(packageName) || 
            authority.equalsIgnoreCase(packageName + ".fileprovider")) {
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
        if (!isSafeUri(context, uri)) {
            throw new SecurityException("Unsafe or unauthorized content URI: " + uri);
        }
        String authority = uri.getAuthority();
        if (authority == null || !isAllowedAuthority(authority)) {
            throw new SecurityException("Authority not allowed: " + authority);
        }
        ProviderInfo info = context.getPackageManager().resolveContentProvider(authority, 0);
        if (info == null || !info.exported) {
            throw new SecurityException("Content provider not exported or invalid");
        }
        if (context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
            throw new SecurityException("Permission denied for URI: " + uri);
        }

        String safePath = uri.getPath() != null ? uri.getPath() : "";
        Uri validatedUri = Uri.parse("content://" + authority + safePath);
        return context.getContentResolver().openInputStream(validatedUri);
    }
}
