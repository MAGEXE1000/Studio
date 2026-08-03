import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { getAndroidTool } from '../../validate-app-installer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '../../..');
const apkPath = path.join(appRoot, 'android/app/build/outputs/apk/release/app-release.apk');
const PROD_FINGERPRINT = '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';

export async function checkSignature(options = {}) {
  const execFn = options.execFn || execSync;

  if (!fs.existsSync(apkPath)) {
    return {
      name: 'Signature',
      pass: true,
      details: 'APK not built locally; skipping signature verification.',
    };
  }

  try {
    const apksigner = getAndroidTool('apksigner');
    const signInfo = execFn(`${apksigner} verify --verbose --print-certs "${apkPath}"`, { encoding: 'utf8' });
    const sha256Match = signInfo.match(/certificate SHA-256 digest:\s+([a-fA-F0-9:]+)/i);
    const fingerprint = sha256Match ? sha256Match[1].replace(/:/g, '').toLowerCase() : '';

    if (fingerprint !== PROD_FINGERPRINT) {
      return {
        name: 'Signature',
        pass: false,
        rootCause: `APK signature fingerprint mismatch! Expected ${PROD_FINGERPRINT}, found ${fingerprint}.`,
        suggestedFix: 'Re-sign APK with official production release keystore (chordex-release.keystore).',
        priority: 'CRITICAL',
        expectedResolution: `APK signed with ${PROD_FINGERPRINT}.`,
      };
    }

    return {
      name: 'Signature',
      pass: true,
      details: `SHA256 Fingerprint verified: ${PROD_FINGERPRINT.substring(0, 16)}...`,
    };
  } catch (err) {
    return {
      name: 'Signature',
      pass: false,
      rootCause: `Failed to execute apksigner: ${err.message}`,
      suggestedFix: 'Install Android SDK Build-Tools and set ANDROID_HOME environment variable.',
      priority: 'HIGH',
      expectedResolution: 'apksigner verification succeeds.',
    };
  }
}
