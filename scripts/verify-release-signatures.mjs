#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// 1. Authoritative Expected Production Certificate
const HARDCODED_PROD_FINGERPRINT = '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
const EXPECTED_FINGERPRINT = (
  process.env.EXPECTED_SIGNATURE_SHA256 || HARDCODED_PROD_FINGERPRINT
).toLowerCase().replace(/:/g, '').trim();

if (EXPECTED_FINGERPRINT !== HARDCODED_PROD_FINGERPRINT) {
  console.error(`::error::CRITICAL SECURITY FAILURE: Attempting release verification with unauthorized fingerprint: ${EXPECTED_FINGERPRINT}`);
  console.error(`  Expected Production Fingerprint: ${HARDCODED_PROD_FINGERPRINT}`);
  process.exit(1);
}

// 2. Locate Target APK & Artifact Paths
let apkPath = process.argv[2] ? path.resolve(process.argv[2]) : '';
const firebaseApkDir = path.join(repoRoot, 'firebase-public/apk');
const gradleApkPath = path.join(repoRoot, 'apps/studio-android/android/app/build/outputs/apk/release/app-release.apk');

if (!apkPath) {
  if (fs.existsSync(firebaseApkDir)) {
    const apks = fs.readdirSync(firebaseApkDir).filter((f) => f.endsWith('.apk'));
    if (apks.length > 0) {
      apkPath = path.join(firebaseApkDir, apks[0]);
    }
  }
  if (!apkPath && fs.existsSync(gradleApkPath)) {
    apkPath = gradleApkPath;
  }
}

if (!apkPath) {
  apkPath = path.join(firebaseApkDir, 'studio-release.apk');
}

const artifactPath = fs.existsSync(firebaseApkDir) ? firebaseApkDir : path.dirname(apkPath);
const apkExists = fs.existsSync(apkPath);

// Locate SHA256 Checksum File
let shaPath = `${apkPath}.sha256`;
if (!fs.existsSync(shaPath)) {
  const alt1 = path.join(path.dirname(apkPath), `${path.basename(apkPath, '.apk')}.apk.sha256`);
  const alt2 = path.join(firebaseApkDir, `${path.basename(apkPath, '.apk')}.sha256`);
  const alt3 = path.join(firebaseApkDir, `${path.basename(apkPath)}.sha256`);
  if (fs.existsSync(alt1)) shaPath = alt1;
  else if (fs.existsSync(alt2)) shaPath = alt2;
  else if (fs.existsSync(alt3)) shaPath = alt3;
  else if (fs.existsSync(firebaseApkDir)) {
    const shas = fs.readdirSync(firebaseApkDir).filter((f) => f.endsWith('.sha256'));
    if (shas.length > 0) {
      shaPath = path.join(firebaseApkDir, shas[0]);
    }
  }
}
const shaExists = fs.existsSync(shaPath);

// Locate release-manifest.json & release-verification-report.json
let manifestPath = path.join(repoRoot, 'release-manifest.json');
if (!fs.existsSync(manifestPath)) {
  const verReportPath = path.join(repoRoot, 'release-verification-report.json');
  if (fs.existsSync(verReportPath)) {
    manifestPath = verReportPath;
  }
}
const manifestExists = fs.existsSync(manifestPath);

// 3. Extract Certificate Fingerprint from APK via keytool or apksigner
let detectedFingerprint = 'NOT_DETECTED';

if (apkExists) {
  const keytoolRes = spawnSync('keytool', ['-printcert', '-jarfile', apkPath], { encoding: 'utf8' });
  if (keytoolRes.status === 0 && keytoolRes.stdout) {
    const match = keytoolRes.stdout.match(/SHA256:\s*([A-Fa-f0-9:]+)/i);
    if (match) {
      detectedFingerprint = match[1].toLowerCase().replace(/:/g, '').trim();
    }
  }

  if (detectedFingerprint === 'NOT_DETECTED') {
    const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
    let apksignerCmd = 'apksigner';
    if (androidHome) {
      const buildToolsDir = path.join(androidHome, 'build-tools');
      if (fs.existsSync(buildToolsDir)) {
        const versions = fs.readdirSync(buildToolsDir).sort().reverse();
        if (versions.length > 0) {
          apksignerCmd = path.join(buildToolsDir, versions[0], process.platform === 'win32' ? 'apksigner.bat' : 'apksigner');
        }
      }
    }
    const apkRes = spawnSync(apksignerCmd, ['verify', '--verbose', '--print-certs', apkPath], { encoding: 'utf8', shell: process.platform === 'win32' });
    if (apkRes.status === 0 && apkRes.stdout) {
      const match = apkRes.stdout.match(/SHA-256 digest:\s*([A-Fa-f0-9:]+)/i);
      if (match) {
        detectedFingerprint = match[1].toLowerCase().replace(/:/g, '').trim();
      }
    }
  }
}

// 4. PRINT COMPLETE DIAGNOSTIC REPORT
console.log('\n================================================================');
console.log('RELEASE SIGNATURE & ARTIFACT VERIFICATION DIAGNOSTIC REPORT');
console.log('================================================================');
console.log(`Expected Certificate:                ${EXPECTED_FINGERPRINT}`);
console.log(`Detected Certificate:                ${detectedFingerprint}`);
console.log(`APK Path:                            ${apkPath}`);
console.log(`Artifact Path:                       ${artifactPath}`);
console.log(`Existence of APK:                    ${apkExists ? 'YES (FOUND)' : 'NO (MISSING)'}`);
console.log(`Existence of SHA File:               ${shaExists ? 'YES (FOUND)' : 'NO (MISSING)'}`);
console.log(`Existence of release-manifest.json:  ${manifestExists ? 'YES (FOUND)' : 'NO (MISSING)'}`);
console.log('================================================================\n');

// 5. FAIL-FAST SECURITY & ARTIFACT ASSERTIONS
if (!apkExists) {
  console.error(`::error::CRITICAL RELEASE FAILURE: Signed APK does not exist at path ${apkPath}!`);
  process.exit(1);
}

if (!shaExists) {
  console.error(`::error::CRITICAL RELEASE FAILURE: SHA256 checksum file does not exist at path ${shaPath}!`);
  process.exit(1);
}

if (!manifestExists) {
  console.error(`::error::CRITICAL RELEASE FAILURE: release-manifest.json does not exist at path ${manifestPath}!`);
  process.exit(1);
}

if (detectedFingerprint !== EXPECTED_FINGERPRINT) {
  console.error(`::error::CRITICAL SECURITY FAILURE: Signature certificate mismatch detected!`);
  console.error(`  Expected Production Fingerprint: ${EXPECTED_FINGERPRINT}`);
  console.error(`  Detected APK Fingerprint:        ${detectedFingerprint}`);
  console.error(`  Refusing release. This APK was NOT signed with the production release key.`);
  process.exit(1);
}

console.log('✓ RELEASE SIGNATURE & ARTIFACT CONTRACT VERIFICATION PASSED');
process.exit(0);
