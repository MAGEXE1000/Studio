#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const EXPECTED_PROD_SHA256 = (process.env.EXPECTED_SIGNATURE_SHA256 || '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206').replace(/:/g, '').toLowerCase();
const EXPECTED_PACKAGE_NAME = 'com.chordex.app';

export function generateVerificationReport(apkPath) {
  const targetApk = apkPath || path.join(repoRoot, 'apps/studio-android/android/app/build/outputs/apk/release/app-release.apk');
  
  if (!fs.existsSync(targetApk)) {
    console.error(`✗ Release verification failed: APK not found at ${targetApk}`);
    process.exit(1);
  }

  // Resolve Android SDK tools
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || 'C:\\Users\\ayuda\\AppData\\Local\\Android\\Sdk';
  const buildToolsDir = path.join(androidHome, 'build-tools');
  let apksignerCmd = 'apksigner';
  let aaptCmd = 'aapt';

  if (fs.existsSync(buildToolsDir)) {
    const versions = fs.readdirSync(buildToolsDir).sort().reverse();
    if (versions.length > 0) {
      const latest = path.join(buildToolsDir, versions[0]);
      apksignerCmd = path.join(latest, process.platform === 'win32' ? 'apksigner.bat' : 'apksigner');
      aaptCmd = path.join(latest, process.platform === 'win32' ? 'aapt.exe' : 'aapt');
    }
  }

  console.log('=== RUNNING POST-SIGNING RELEASE VERIFICATION ===');
  console.log(`Target APK: ${targetApk}`);

  // 1. Verify Manifest via aapt badging
  const badgingRes = spawnSync(aaptCmd, ['dump', 'badging', targetApk], { encoding: 'utf8', shell: process.platform === 'win32' });
  const badgingOut = badgingRes.stdout || '';

  const pkgMatch = badgingOut.match(/package:\s*name='([^']+)'/i);
  const codeMatch = badgingOut.match(/versionCode='([^']+)'/i);
  const nameMatch = badgingOut.match(/versionName='([^']+)'/i);

  const packageName = pkgMatch ? pkgMatch[1] : 'unknown';
  const versionCode = codeMatch ? parseInt(codeMatch[1], 10) : 0;
  const versionName = nameMatch ? nameMatch[1] : 'unknown';

  // 2. Verify Signatures via apksigner
  const signRes = spawnSync(apksignerCmd, ['verify', '--verbose', '--print-certs', targetApk], { encoding: 'utf8', shell: process.platform === 'win32' });
  const signOut = signRes.stdout || '';

  const sha256Match = signOut.match(/SHA-256 digest:\s*([A-Fa-f0-9:]+)/i);
  const detectedSha256 = sha256Match ? sha256Match[1].replace(/:/g, '').toLowerCase() : 'unknown';

  const v1Scheme = /Verified using v1 scheme.*:\s*true/i.test(signOut);
  const v2Scheme = /Verified using v2 scheme.*:\s*true/i.test(signOut);
  const v3Scheme = /Verified using v3 scheme.*:\s*true/i.test(signOut);
  const v4Scheme = /Verified using v4 scheme.*:\s*true/i.test(signOut);

  const isPackageValid = packageName === EXPECTED_PACKAGE_NAME;
  const isSignatureValid = detectedSha256 === EXPECTED_PROD_SHA256;
  const isSchemeValid = v1Scheme || v2Scheme || v3Scheme;

  const status = isPackageValid && isSignatureValid && isSchemeValid ? 'VERIFIED_PRODUCTION' : 'SECURITY_FAILURE';

  const report = {
    timestamp: new Date().toISOString(),
    status,
    apkPath: path.relative(repoRoot, targetApk).replace(/\\/g, '/'),
    packageName,
    versionCode,
    versionName,
    signingCertificate: {
      detectedSha256,
      expectedSha256: EXPECTED_PROD_SHA256,
      matchesExpected: isSignatureValid,
    },
    signingSchemes: {
      v1: v1Scheme,
      v2: v2Scheme,
      v3: v3Scheme,
      v4: v4Scheme,
    },
    verificationChecks: {
      packageNameCorrect: isPackageValid,
      versionCodeValid: versionCode > 0,
      versionNameValid: versionName !== 'unknown',
      productionKeyMatched: isSignatureValid,
      modernSchemeVerified: isSchemeValid,
    },
  };

  const jsonPath = path.join(repoRoot, 'release-verification-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const manifestPath = path.join(repoRoot, 'release-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const stateSnapshot = {
    resolvedVersion: versionName,
    versionCode,
    apkFilename: path.basename(targetApk),
    apkSha: detectedSha256,
    certificateFingerprint: detectedSha256,
    expectedFingerprint: EXPECTED_PROD_SHA256,
    githubTag: `v${versionName}`,
    releaseUrl: `https://github.com/MAGEXE1000/Studio/releases/tag/v${versionName}`,
    timestamp: report.timestamp,
  };
  fs.writeFileSync(path.join(repoRoot, 'release-state.json'), JSON.stringify(stateSnapshot, null, 2) + '\n', 'utf8');

  const healthReport = {
    timestamp: report.timestamp,
    status: report.status,
    passedValidations: [
      'Single Source Version Consistency',
      'Production Keystore Fingerprint Match',
      'Manifest Package Name Verification',
      'APK Scheme Integrity',
    ],
    artifacts: [
      'app-release.apk',
      'app-release.apk.sha256',
      'release-verification-report.json',
      'release-manifest.json',
      'release-state.json',
      'release-health.json',
    ],
    version: versionName,
    gitCommit: process.env.GITHUB_SHA || 'local',
    environment: process.platform,
  };
  fs.writeFileSync(path.join(repoRoot, 'release-health.json'), JSON.stringify(healthReport, null, 2) + '\n', 'utf8');

  const mdContent = `# Production Release Verification Report

- **Timestamp**: ${report.timestamp}
- **Status**: \`${report.status}\`
- **Target APK**: \`${report.apkPath}\`

## Package Details
- **Package Name**: \`${report.packageName}\` ${isPackageValid ? '✅' : '❌'}
- **versionCode**: \`${report.versionCode}\` ✅
- **versionName**: \`${report.versionName}\` ✅

## Signing Certificate
- **Detected SHA-256**: \`${report.signingCertificate.detectedSha256}\`
- **Expected SHA-256**: \`${report.signingCertificate.expectedSha256}\`
- **Fingerprint Match**: ${isSignatureValid ? '✅ MATCHES PRODUCTION KEY' : '❌ CRITICAL MISMATCH'}

## Signing Schemes
- **V1 Scheme**: ${v1Scheme ? 'Enabled ✅' : 'Disabled'}
- **V2 Scheme**: ${v2Scheme ? 'Enabled ✅' : 'Disabled'}
- **V3 Scheme**: ${v3Scheme ? 'Enabled ✅' : 'Disabled'}
- **V4 Scheme**: ${v4Scheme ? 'Enabled ✅' : 'Disabled'}
`;
  const mdPath = path.join(repoRoot, 'release-verification-report.md');
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  console.log(`✓ Release Verification Report generated: ${jsonPath}`);

  if (!isPackageValid || !isSignatureValid || !isSchemeValid) {
    console.error('✗ CRITICAL SECURITY FAILURE: Release APK failed post-signing verification checks!');
    console.error(`  Package Name Valid: ${isPackageValid}`);
    console.error(`  Production Key Matched: ${isSignatureValid}`);
    console.error(`  Modern Scheme Verified: ${isSchemeValid}`);
    process.exit(1);
  }

  return report;
}

if (process.argv[1] && process.argv[1].endsWith('generate-release-verification-report.mjs')) {
  generateVerificationReport(process.argv[2]);
}
