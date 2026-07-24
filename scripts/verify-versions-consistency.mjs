import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Run Repository-Wide Reference & Navigation Integrity Auditors first
execSync('node scripts/verify-all-references.mjs', { stdio: 'inherit' });
execSync('node scripts/verify-navigation-integrity.mjs', { stdio: 'inherit' });

const paths = {
  webPkg: path.join(repoRoot, 'apps/studio-web/package.json'),
  androidPkg: path.join(repoRoot, 'apps/studio-android/package.json'),
  appVersionTs: path.join(repoRoot, 'packages/studio-core/src/lib/startup/appVersion.ts'),
  buildGradle: path.join(repoRoot, 'apps/studio-android/android/app/build.gradle'),
  changelog: path.join(repoRoot, 'CHANGELOG.md'),
  releaseNotes: path.join(repoRoot, 'release-notes.md'),
  versionJson: path.join(repoRoot, 'apps/studio-android/public/version.json'),
  appReleaseJson: path.join(repoRoot, 'apps/studio-android/public/app-release.json'),
  releaseManifest: path.join(repoRoot, 'release-manifest.json'),
};

console.log('=== RUNNING MULTI-MANIFEST VERSION CONSISTENCY CHECK ===');

// 1. Single Source of Truth: appVersion.ts
if (!fs.existsSync(paths.appVersionTs)) {
  console.error(`::error::VERSION CONSISTENCY FAILURE: appVersion.ts not found at ${paths.appVersionTs}`);
  process.exit(1);
}
const appVersionSrc = fs.readFileSync(paths.appVersionTs, 'utf8');
const webVersionMatch = appVersionSrc.match(/export\s+const\s+WEB_VERSION\s*=\s*['"]([^'"]+)['"]/);
const nativeVersionMatch = appVersionSrc.match(/export\s+const\s+NATIVE_VERSION\s*=\s*['"]([^'"]+)['"]/);

if (!webVersionMatch || !nativeVersionMatch) {
  console.error('::error::VERSION CONSISTENCY FAILURE: Could not parse WEB_VERSION or NATIVE_VERSION from appVersion.ts');
  process.exit(1);
}

const EXPECTED_VERSION = nativeVersionMatch[1];
const EXPECTED_WEB_VERSION = webVersionMatch[1];

if (EXPECTED_VERSION !== EXPECTED_WEB_VERSION) {
  console.error(`::error::VERSION CONSISTENCY FAILURE: NATIVE_VERSION (${EXPECTED_VERSION}) and WEB_VERSION (${EXPECTED_WEB_VERSION}) in appVersion.ts disagree!`);
  process.exit(1);
}

console.log(`Single Source of Truth Version: ${EXPECTED_VERSION}`);

// Calculate expected versionCode
const vParts = EXPECTED_VERSION.split('.').map(Number);
const EXPECTED_VERSION_CODE = vParts[0] * 10000 + vParts[1] * 100 + vParts[2];

function assertVersion(filePath, detectedVersion, label) {
  if (detectedVersion !== EXPECTED_VERSION) {
    console.error(`::error::VERSION CONSISTENCY FAILURE: Artifact version mismatch detected!`);
    console.error(`  Expected Version: ${EXPECTED_VERSION}`);
    console.error(`  Detected Version: ${detectedVersion}`);
    console.error(`  Source File:      ${filePath}`);
    console.error(`  Label:            ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label} matches version ${EXPECTED_VERSION} (${filePath})`);
}

// 2. Web package.json
if (fs.existsSync(paths.webPkg)) {
  const webPkg = JSON.parse(fs.readFileSync(paths.webPkg, 'utf8'));
  assertVersion(paths.webPkg, webPkg.version, 'apps/studio-web/package.json');
}

// 3. Android package.json
if (fs.existsSync(paths.androidPkg)) {
  const androidPkg = JSON.parse(fs.readFileSync(paths.androidPkg, 'utf8'));
  assertVersion(paths.androidPkg, androidPkg.version, 'apps/studio-android/package.json');
}

// 4. build.gradle
if (fs.existsSync(paths.buildGradle)) {
  const gradleSrc = fs.readFileSync(paths.buildGradle, 'utf8');
  const nameMatch = gradleSrc.match(/versionName\s+['"]([^'"]+)['"]/);
  const codeMatch = gradleSrc.match(/versionCode\s+(\d+)/);

  if (!nameMatch || !codeMatch) {
    console.error(`::error::VERSION CONSISTENCY FAILURE: Could not parse versionName/versionCode in ${paths.buildGradle}`);
    process.exit(1);
  }

  assertVersion(paths.buildGradle, nameMatch[1], 'build.gradle versionName');
  const detectedCode = parseInt(codeMatch[1], 10);
  if (detectedCode !== EXPECTED_VERSION_CODE) {
    console.error(`::error::VERSION CONSISTENCY FAILURE: versionCode mismatch in ${paths.buildGradle}!`);
    console.error(`  Expected versionCode: ${EXPECTED_VERSION_CODE}`);
    console.error(`  Detected versionCode: ${detectedCode}`);
    process.exit(1);
  }
  console.log(`✓ build.gradle versionCode matches ${EXPECTED_VERSION_CODE}`);
}

// 5. CHANGELOG.md
if (fs.existsSync(paths.changelog)) {
  const changelogText = fs.readFileSync(paths.changelog, 'utf8');
  const changelogRegex = new RegExp(`^(?:#|##)\\s+(?:Version\\s+)?v?${EXPECTED_VERSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  if (!changelogRegex.test(changelogText)) {
    console.error(`::error::VERSION CONSISTENCY FAILURE: CHANGELOG.md is missing section for version ${EXPECTED_VERSION}!`);
    process.exit(1);
  }
  console.log(`✓ CHANGELOG.md section for v${EXPECTED_VERSION} verified.`);
}

// 6. release-notes.md (if present)
if (fs.existsSync(paths.releaseNotes)) {
  const rnText = fs.readFileSync(paths.releaseNotes, 'utf8');
  const rnMatch = rnText.match(/Version\s+(\d+\.\d+\.\d+)/i);
  if (rnMatch && rnMatch[1] !== EXPECTED_VERSION) {
    assertVersion(paths.releaseNotes, rnMatch[1], 'release-notes.md');
  }
}

// 7. version.json (if present)
if (fs.existsSync(paths.versionJson)) {
  const vj = JSON.parse(fs.readFileSync(paths.versionJson, 'utf8'));
  assertVersion(paths.versionJson, vj.version || vj.versionName, 'public/version.json');
}

// 8. app-release.json (if present)
if (fs.existsSync(paths.appReleaseJson)) {
  const arj = JSON.parse(fs.readFileSync(paths.appReleaseJson, 'utf8'));
  assertVersion(paths.appReleaseJson, arj.version || arj.versionName, 'public/app-release.json');
}

// 9. release-manifest.json (if present)
if (fs.existsSync(paths.releaseManifest)) {
  const rm = JSON.parse(fs.readFileSync(paths.releaseManifest, 'utf8'));
  assertVersion(paths.releaseManifest, rm.releaseVersion || rm.versionName || rm.version, 'release-manifest.json');
}

console.log('\x1b[32m=== MULTI-MANIFEST VERSION CONSISTENCY PASSED CLEANLY ===\x1b[0m');
process.exit(0);
