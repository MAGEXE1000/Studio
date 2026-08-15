package com.chordex.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * SafeContentResolver centralizes all ContentResolver operations on incoming
 * untrusted URIs (e.g. from ACTION_VIEW and ACTION_SEND intents).
 *
 * Implements strict anti-confused-deputy verification, scheme and authority validation,
 * permission checks, UTF-8 text bounding against memory DoS, and path-traversal prevention.
 */
public final class SafeContentResolver {
    public static final int DEFAULT_MAX_TEXT_BYTES = 10 * 1024 * 1024; // 10 MB

    private SafeContentResolver() {}

    /**
     * Validates whether a URI is a safe, external content URI granted to this app.
     *
     * @param context Application/Activity context
     * @param uri The URI to validate
     * @return true if the URI is safe to access via ContentResolver, false otherwise
     */
    public static boolean isSafeUri(Context context, Uri uri) {
        if (context == null || uri == null) {
            return false;
        }

        // 1. Require "content" scheme
        String scheme = uri.getScheme();
        if (scheme == null || !"content".equalsIgnoreCase(scheme)) {
            return false;
        }

        // 2. Require non-empty authority
        String authority = uri.getAuthority();
        if (authority == null || authority.trim().isEmpty()) {
            return false;
        }

        // 3. Anti-Confused-Deputy: Reject internal app and FileProvider URIs
        String packageName = context.getPackageName();
        if (packageName != null && !packageName.isEmpty()) {
            String lowerAuthority = authority.toLowerCase();
            String lowerPackageName = packageName.toLowerCase();
            if (lowerAuthority.contains(lowerPackageName) ||
                lowerAuthority.equals("com.chordex.app.fileprovider") ||
                lowerAuthority.equals(lowerPackageName + ".fileprovider")) {
                return false;
            }
        }

        // 4. Verify read permission grant
        try {
            return context.checkCallingOrSelfUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    == PackageManager.PERMISSION_GRANTED;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Safely queries the display name of a content URI via OpenableColumns.DISPLAY_NAME.
     *
     * @param context Application/Activity context
     * @param uri Content URI
     * @return Sanitized file name string
     */
    public static String getSafeDisplayName(Context context, Uri uri) {
        if (context == null || uri == null || !isSafeUri(context, uri)) {
            return "shared_file";
        }

        String displayName = null;
        try (Cursor cursor = context.getContentResolver().query(
                uri,
                new String[]{OpenableColumns.DISPLAY_NAME},
                null,
                null,
                null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    displayName = cursor.getString(index);
                }
            }
        } catch (Exception e) {
            // Query failed, fall back to path extraction
        }

        if (displayName == null || displayName.trim().isEmpty()) {
            String path = uri.getLastPathSegment();
            if (path != null && !path.trim().isEmpty()) {
                int cut = path.lastIndexOf('/');
                displayName = (cut != -1) ? path.substring(cut + 1) : path;
            }
        }

        if (displayName == null || displayName.trim().isEmpty()) {
            displayName = "shared_file";
        }

        // Sanitize file name to prevent path traversal or special control characters
        displayName = new File(displayName).getName();
        displayName = displayName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return displayName.isEmpty() ? "shared_file" : displayName;
    }

    /**
     * Safely queries the MIME type of a content URI.
     *
     * @param context Application/Activity context
     * @param uri Content URI
     * @return MIME type string, or null if unresolvable or unsafe
     */
    public static String getSafeMimeType(Context context, Uri uri) {
        if (context == null || uri == null || !isSafeUri(context, uri)) {
            return null;
        }
        try {
            return context.getContentResolver().getType(uri);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Safely opens an InputStream for a validated content URI.
     *
     * @param context Application/Activity context
     * @param uri Content URI
     * @return InputStream for the content
     * @throws IOException If opening the stream fails
     * @throws SecurityException If URI fails safety validation
     */
    public static InputStream openSafeInputStream(Context context, Uri uri) throws IOException, SecurityException {
        if (context == null || uri == null) {
            throw new IllegalArgumentException("Context and URI cannot be null");
        }
        if (!isSafeUri(context, uri)) {
            throw new SecurityException("Unsafe or unauthorized content URI: " + uri);
        }
        return context.getContentResolver().openInputStream(uri);
    }

    /**
     * Safely reads UTF-8 text content from a content URI with an upper-bound byte limit
     * to prevent memory exhaustion DoS attacks.
     *
     * @param context Application/Activity context
     * @param uri Content URI
     * @param maxBytes Maximum allowable bytes to read (<= 0 uses default 10MB)
     * @return String content in UTF-8
     * @throws IOException If reading fails or size exceeds maxBytes
     * @throws SecurityException If URI fails safety validation
     */
    public static String readSafeTextContent(Context context, Uri uri, int maxBytes) throws IOException, SecurityException {
        int limit = (maxBytes > 0) ? maxBytes : DEFAULT_MAX_TEXT_BYTES;
        try (InputStream inputStream = openSafeInputStream(context, uri)) {
            if (inputStream == null) {
                return null;
            }
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int totalBytesRead = 0;
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                totalBytesRead += bytesRead;
                if (totalBytesRead > limit) {
                    throw new IOException("Content exceeds maximum allowed size of " + limit + " bytes");
                }
                outputStream.write(buffer, 0, bytesRead);
            }
            return outputStream.toString(StandardCharsets.UTF_8.name());
        }
    }

    /**
     * Safely copies content from a URI to a uniquely named file in the application's cache directory.
     * Enforces path traversal verification to prevent writing outside the cache directory.
     *
     * @param context Application/Activity context
     * @param uri Content URI
     * @param fileName Preferred file name
     * @return File referencing the cached copy
     * @throws IOException If stream copy fails
     * @throws SecurityException If URI fails safety validation or path traversal detected
     */
    public static File copySafeStreamToCache(Context context, Uri uri, String fileName) throws IOException, SecurityException {
        if (context == null || uri == null) {
            throw new IllegalArgumentException("Context and URI cannot be null");
        }
        if (!isSafeUri(context, uri)) {
            throw new SecurityException("Unsafe or unauthorized content URI: " + uri);
        }

        File cacheDir = context.getCacheDir();
        if (cacheDir == null) {
            throw new IOException("Cache directory is not available");
        }

        String safeName = (fileName != null && !fileName.trim().isEmpty())
                ? fileName.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "shared_file";
        safeName = new File(safeName).getName();
        if (safeName.isEmpty()) {
            safeName = "shared_file";
        }

        File tempFile = new File(cacheDir, "shared_" + System.currentTimeMillis() + "_" + safeName);

        String canonicalCacheDirPath = cacheDir.getCanonicalPath();
        if (!canonicalCacheDirPath.endsWith(File.separator)) {
            canonicalCacheDirPath += File.separator;
        }
        String canonicalDestPath = tempFile.getCanonicalPath();
        if (!canonicalDestPath.startsWith(canonicalCacheDirPath)) {
            throw new SecurityException("Path traversal attempt blocked: " + tempFile.getName());
        }

        try (InputStream inputStream = openSafeInputStream(context, uri);
             FileOutputStream outputStream = new FileOutputStream(tempFile)) {
            if (inputStream == null) {
                throw new IOException("Failed to open safe input stream for: " + uri);
            }
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }

        return tempFile;
    }
}
