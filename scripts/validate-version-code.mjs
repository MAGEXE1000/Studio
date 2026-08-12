/**
 * validate-version-code.mjs
 *
 * Deterministic fail-fast validator for versionCode collision safety.
 *
 * The existing formula is: MAJ * 10000 + MIN * 100 + PAT
 * This formula produces ambiguous (colliding) versionCodes when:
 *   - PAT >= 100: e.g., 4.0.100 => 40100 == 4.1.0 => 40100
 *   - MIN >= 100: e.g., 4.100.0 => 41000 == 4.10.0 => 41000 (if PAT=0)
 *
 * Proven collision: 4.10.100 => 41100 == 4.11.0 => 41100
 *
 * The formula is NOT changed (published versionCodes must remain monotonic).
 * Instead, this validator rejects any version string where MIN >= 100 or PAT >= 100
 * before any expensive build work begins.
 *
 * Additionally, it validates that the candidate versionCode is strictly greater
 * than the current NATIVE_VERSION_CODE in appVersion.ts (cross-check).
 *
 * Usage: node scripts/validate-version-code.mjs [version]
 *   version — optional, defaults to reading from root package.json
 *
 * Exit codes:
 *   0 — safe (no collision possible, versionCode strictly increasing)
 *   1 — collision possible (MIN >= 100 or PAT >= 100), or not strictly increasing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAppVersionInfo } from './parse-version.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ── Read version ──────────────────────────────────────────────────────────────

let versionString = process.argv[2];
if (!versionString) {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  versionString = rootPkg.version;
}

const semverMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec((versionString || '').trim());
if (!semverMatch) {
  console.error('validate-version-code: \u2717 FATAL: Version "' + versionString + '" is not valid strict SemVer (X.Y.Z)');
  process.exit(1);
}

const maj = parseInt(semverMatch[1], 10);
const min = parseInt(semverMatch[2], 10);
const pat = parseInt(semverMatch[3], 10);
const candidateVersionCode = maj * 10000 + min * 100 + pat;

console.log('=== VERSIONCODE SAFETY VALIDATION ===');
console.log('Version:         ' + versionString);
console.log('Formula:         MAJ*10000 + MIN*100 + PAT');
console.log('Candidate code:  ' + candidateVersionCode);
console.log('');

// ── SAFETY CHECK 1: Collision range ──────────────────────────────────────────
// When PAT >= 100, versionCode(MAJ.MIN.PAT) == versionCode(MAJ.(MIN+1).(PAT-100))
// When MIN >= 100, versionCode(MAJ.MIN.PAT) == versionCode(MAJ.(MIN-100).(PAT + MIN*100 - ...))
// The simple bound: PAT must be 0..99 and MIN must be 0..99.

if (pat >= 100) {
  const collidesWith = maj + '.' + (min + 1) + '.' + (pat - 100);
  const collisionCode = maj * 10000 + (min + 1) * 100 + (pat - 100);
  console.error('validate-version-code: \u2717 FATAL: VERSIONCODE COLLISION DETECTED');
  console.error('  Version ' + versionString + ' produces versionCode ' + candidateVersionCode);
  console.error('  Version ' + collidesWith + ' ALSO produces versionCode ' + collisionCode);
  console.error('  (PAT=' + pat + ' >= 100 causes the current MAJ*10000+MIN*100+PAT formula to collide)');
  console.error('  Fix: Keep PAT < 100. If more than 99 patches are needed, increment MINOR.');
  process.exit(1);
}

if (min >= 100) {
  const collisionCode = maj * 10000 + (min - 100) * 100 + pat + 10000;
  console.error('validate-version-code: \u2717 FATAL: VERSIONCODE COLLISION DETECTED');
  console.error('  Version ' + versionString + ' produces versionCode ' + candidateVersionCode);
  console.error('  (MIN=' + min + ' >= 100 causes the current MAJ*10000+MIN*100+PAT formula to collide with MAJ+1.x.y)');
  console.error('  Fix: Keep MIN < 100. If more than 99 minor versions are needed, increment MAJOR.');
  process.exit(1);
}

console.log('\u2713 PAT=' + pat + ' is within safe range (0..99)');
console.log('\u2713 MIN=' + min + ' is within safe range (0..99)');

// ── SAFETY CHECK 2: Strictly greater than current NATIVE_VERSION_CODE ─────────
// This cross-checks that the derived formula result matches what is recorded in
// appVersion.ts, and that it has not gone backwards.

let currentVersionCode;
let currentVersion;
try {
  const info = getAppVersionInfo();
  currentVersionCode = info.nativeVersionCode;
  currentVersion = info.nativeVersion;
} catch (e) {
  console.error('validate-version-code: \u2717 FATAL: Could not read NATIVE_VERSION_CODE from appVersion.ts:', e.message);
  process.exit(1);
}

console.log('appVersion.ts code: ' + currentVersionCode + ' (v' + currentVersion + ')');

// The formula-derived code must match NATIVE_VERSION_CODE when the version strings agree.
// If they differ, the version files are out of sync (sync-versions.mjs should be run first).
const formulaDerivedCurrentCode = (() => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec((currentVersion || '').trim());
  if (!m) return -1;
  return parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[3], 10);
})();

if (formulaDerivedCurrentCode !== currentVersionCode) {
  console.error('validate-version-code: \u2717 FATAL: appVersion.ts NATIVE_VERSION_CODE (' + currentVersionCode + ') does not');
  console.error('  match the formula result for NATIVE_VERSION ' + currentVersion + ' (' + formulaDerivedCurrentCode + ').');
  console.error('  The version files are inconsistent. Run sync-versions.mjs first.');
  process.exit(1);
}

console.log('\u2713 NATIVE_VERSION_CODE is formula-consistent');

// If candidate is the SAME version as current (re-running the validator), skip the > check.
if (versionString === currentVersion) {
  console.log('\u2713 Candidate equals current version — versionCode continuity check skipped');
} else if (candidateVersionCode <= currentVersionCode) {
  console.error('validate-version-code: \u2717 FATAL: Candidate versionCode (' + candidateVersionCode + ') is not');
  console.error('  strictly greater than current NATIVE_VERSION_CODE (' + currentVersionCode + ').');
  console.error('  Android requires monotonically increasing versionCodes.');
  process.exit(1);
} else {
  console.log('\u2713 Candidate versionCode ' + candidateVersionCode + ' > current ' + currentVersionCode + ' (monotonic)');
}

console.log('');
console.log('validate-version-code: \u2713 PASS — versionCode ' + candidateVersionCode + ' is safe and unique.');
process.exit(0);
