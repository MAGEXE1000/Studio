# Chordex Studio — Environment Setup Guide

This guide details the step-by-step setup procedure for configuring a local development environment, installing dependencies, configuring environment variables, and building/running both the Web and Android clients.

---

## 1. Prerequisites & Version Specifications

To guarantee consistent builds and avoid local compiler mismatches, all installations must conform to the following version specifications:

| Component         | Target Version | Notes / Provider                    | Source                                               |
| ----------------- | -------------- | ----------------------------------- | ---------------------------------------------------- |
| **Node.js**       | `v20.x`        | LTS recommended (e.g. Node 20.12.0) | `.github/workflows/android-ci.yml#L50`               |
| **pnpm**          | `10.26.1`      | Local workspace manager             | `.github/workflows/android-ci.yml#L46`               |
| **Java JDK**      | `21`           | Eclipse Temurin distribution        | `.github/workflows/android-ci.yml#L55-L56`           |
| **Android SDK**   | `35`           | Android 15                          | `apps/studio-android/android/variables.gradle#L3-L4` |
| **minSdkVersion** | `23`           | Android 6.0 Marshmallow             | `apps/studio-android/android/variables.gradle#L2`    |
| **Capacitor CLI** | `^6.2.1`       | Native Android Bridge CLI           | `apps/studio-android/package.json#L16`               |

---

## 2. Installation Procedures

Follow these steps to configure your local development utilities:

### Step 1: Node.js & pnpm Setup

1. Install Node.js v20 (LTS) via your preferred package manager (e.g., `nvm` or direct installer).
2. Install pnpm v10.26.1 globally:
   ```bash
   npm install -g pnpm@10.26.1
   ```

### Step 2: Java Setup (JDK 21)

1. Download Eclipse Temurin JDK 21 from [Adoptium](https://adoptium.net/).
2. Install the JDK and ensure the `JAVA_HOME` environment variable is configured to point to the JDK 21 installation path.
3. Verify the installation:
   ```bash
   java -version
   ```

### Step 3: Android Studio & Android SDK Setup

1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open Android Studio and navigate to **Tools > SDK Manager**.
3. Under the **SDK Platforms** tab, check **Android 15.0 ("VanillaIceCream")** (API Level 35) to install the target SDK.
4. Under the **SDK Tools** tab, verify that the following are installed:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools
5. Configure the `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) environment variable pointing to your local SDK location (usually `%LOCALAPPDATA%\Android\Sdk` on Windows or `~/Library/Android/sdk` on macOS).

---

## 3. Configuration & Environment Variables

Select and configure active settings and API keys to connect backends:

### A. Firebase Config Setup

By default, the core package registers Firebase client credentials via a bundled configuration file located at `packages/studio-core/firebase.config.json`.

If you need to point development to a custom staging or testing Firebase instance, you can override these options by adding the following variables to your local `.env` file at the root of `apps/studio-web/` or `apps/studio-android/`:

```env
# Optional Firebase Client Overrides
VITE_FIREBASE_API_KEY=AIzaSyA1...
VITE_FIREBASE_AUTH_DOMAIN=custom-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=custom-project
VITE_FIREBASE_STORAGE_BUCKET=custom-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234:web:abcd
```

Source:

- [firebase.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/firebase.ts#L40-L52)

### B. Supabase Config Setup

Supabase handles user data synchronization. Configure the local `.env` parameters in both `apps/studio-web/.env` and `apps/studio-android/.env`:

```env
# Selected Sync Provider
VITE_SYNC_BACKEND_PROVIDER=supabase-realtime

# Supabase Credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Source:

- [apps/studio-android/.env.example](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/.env.example)
- [apps/studio-web/.env.example](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-web/.env.example)

### C. Other Environment Variables

- **`VITE_OTA_BASE_URL`**: Base URL pointing to the Firebase public metadata tracker endpoint (defaults to `https://studio-30f44.web.app` if omitted).
- **`VITE_OTA_VERSION_URL`**: Hardcoded override url to bypass the standard version checks mapping (only used for diagnostics).

Source:

- [releaseMetadata.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/updater/releaseMetadata.ts#L34-L40)

---

## 4. Building the Application

Execute these build target commands from the terminal to build components:

### Step 1: Install Dependencies

From the repository root, run:

```bash
pnpm install --frozen-lockfile
```

_Note: Using npm or yarn directly is blocked by workspace hooks._

### Step 2: First Web Build

To compile the responsive desktop web app:

```bash
pnpm run build:web
```

This generates compiled production static assets in `apps/studio-web/dist/`.

### Step 3: First Android build

To compile the Android client:

1. Compile the web assets and sync the Capacitor wrappers:
   ```bash
   pnpm run build:android:web
   ```
   This runs the Vite build and executes `npx cap sync android` to copy assets to the native folder.
2. Open the native project in Android Studio:
   ```bash
   npx cap open android
   ```
3. In Android Studio, build the APK via **Build > Build Bundle(s) / APK(s) > Build APK(s)**, or run the app on a connected device/emulator.

Source:

- [package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/package.json#L7-L10)
- [apps/studio-android/package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/package.json#L7-L11)

---

## 5. Common Installation Problems & Troubleshooting

Refer to these resolutions if local operations or compilations fail:

### 1. Java Heap OutOfMemoryError during Android compilation

- **Problem**: Building the APK in Gradle fails with heap space errors.
- **Resolution**: Ensure memory thresholds are configured in `apps/studio-android/android/gradle.properties`:
  ```properties
  org.gradle.jvmargs=-Xmx3072m -XX:MaxPermSize=512m
  ```

### 2. Capacitor Android Sync Mismatches

- **Problem**: Native Capacitor plugins fail to load or report missing imports.
- **Resolution**: Run `npx cap sync android` directly from `apps/studio-android/` to re-synchronize node modules dependencies.

### 3. Keystore Conflict Errors

- **Problem**: Run/Install fails because the signing certificate fingerprint conflicts with a previously installed debug or release build.
- **Resolution**: Uninstall the previous application package from the target emulator or device before installing the new build:
  ```bash
  adb uninstall com.chordex.app
  ```

---

## 6. Development Verification Checklist

Before starting task implementation, verify that your environment is fully operational:

- [ ] Run `pnpm run typecheck:libs` and verify it completes with zero type errors.
- [ ] Run `pnpm run build:web` and check that `apps/studio-web/dist/` is successfully populated.
- [ ] Run `pnpm run build:android:web` and verify that the sync completes without warnings.
- [ ] Verify that a local `.env` configuration file exists in the targeted application folder.
