# Reusable Knowledge — Android Native & Capacitor

This document outlines key technical standards for the native Android integration, Capacitor configurations, Webview bridges, and performance adjustments.

---

## 1. Native Build Settings & Gradle Coordinates
- **SDK Coordinates**:
  - `minSdkVersion` = 23 (Android 6.0 Marshmallow)
  - `compileSdkVersion` = 35 (Android 15)
  - `targetSdkVersion` = 35 (Android 15)
- **Gradle Properties**:
  - Memory heap size thresholds for Gradle compilation should be set via `org.gradle.jvmargs=-Xmx3072m -XX:MaxPermSize=512m` to prevent compiler heap exhaustion errors in low-resource build environments.

Source:
* [variables.gradle](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/android/variables.gradle#L2-L4)

---

## 2. Capacitor Plugins & WebView Constraints
- **Touch-Target Sizing**: All interactive elements in touch interfaces must match a minimum size of `44x44dp` to comply with touch-safety standards and prevent taps from intercepting adjacent components.
- **Orientation Restrictions**: Lock device viewport orientations where appropriate using `@capacitor/screen-orientation` configuration commands to prevent layout breakages during rapid rotation.
- **WebView Performance**: Android WebView assets must be updated regularly. Hashed JS assets inside `/assets/**` should be marked with immutable caching headers.

Source:
* [apps/studio-android/package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/package.json#L28-L36)
