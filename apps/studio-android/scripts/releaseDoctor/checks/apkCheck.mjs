import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '../../..');
const apkPath = path.join(appRoot, 'android/app/build/outputs/apk/release/app-release.apk');

export async function checkApkIntegrity(options = {}) {
  const allowMissingApk = options.allowMissingApk ?? (process.env.ALLOW_MISSING_PREV_APK === 'true');

  if (!fs.existsSync(apkPath)) {
    if (allowMissingApk) {
      return {
        name: 'APK',
        pass: true,
        details: 'APK not compiled locally, but ALLOW_MISSING_PREV_APK=true is active',
      };
    }
    return {
      name: 'APK',
      pass: false,
      rootCause: `Compiled APK not found at ${apkPath}.`,
      suggestedFix: 'Run pnpm build:android before running release checks or building release bundle.',
      priority: 'HIGH',
      expectedResolution: `APK binary present at ${apkPath}.`,
    };
  }

  const stat = fs.statSync(apkPath);
  if (stat.size < 1000000) {
    return {
      name: 'APK',
      pass: false,
      rootCause: `APK size (${stat.size} bytes) is suspiciously small or corrupted.`,
      suggestedFix: 'Re-run clean release APK assembly with ./gradlew assembleRelease.',
      priority: 'HIGH',
      expectedResolution: 'APK size > 1MB.',
    };
  }

  return {
    name: 'APK',
    pass: true,
    details: `APK size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
  };
}
