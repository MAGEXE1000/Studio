#!/usr/bin/env node
/**
 * verify-stage-core-sync.mjs
 *
 * Verifies that the canonical stage-core source in:
 *   packages/ui-shared/src/features/stagex/stage-core
 * is in 100% byte-level sync with the generated targets in:
 *   apps/studio-web/public/stage-core
 *   apps/studio-android/public/stage-core
 *
 * Prevents silent divergence and ensures zero independently editable drift.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const canonicalDir = path.join(
  repoRoot,
  'packages',
  'ui-shared',
  'src',
  'features',
  'stagex',
  'stage-core'
);

const targets = [
  { name: 'Web', dir: path.join(repoRoot, 'apps', 'studio-web', 'public', 'stage-core') },
  { name: 'Android', dir: path.join(repoRoot, 'apps', 'studio-android', 'public', 'stage-core') },
];

console.log('================================================================');
console.log('   STAGEX STAGE-CORE ARCHITECTURE & INTEGRITY VERIFICATION');
console.log('================================================================');

if (!fs.existsSync(canonicalDir)) {
  console.error(`✗ CRITICAL ERROR: Canonical source directory missing: ${canonicalDir}`);
  process.exit(1);
}

function computeHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function getAllFiles(dir, relativeTo = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.git') || entry.name.startsWith('.temp')) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relativeTo));
    } else if (entry.isFile()) {
      if (entry.name === '.stage-core-generated' || entry.name === '.generated-manifest.json') continue;
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

const canonicalFiles = getAllFiles(canonicalDir);
if (canonicalFiles.length === 0) {
  console.error('✗ CRITICAL ERROR: Canonical source directory is empty!');
  process.exit(1);
}

console.log(`Canonical Source: ${path.relative(repoRoot, canonicalDir)} (${canonicalFiles.length} files verified)`);

let totalErrors = 0;

for (const target of targets) {
  const relTarget = path.relative(repoRoot, target.dir);
  console.log(`\nVerifying ${target.name} target: ${relTarget}...`);

  if (!fs.existsSync(target.dir)) {
    console.error(`  ✗ ERROR: Target directory does not exist! Run "pnpm sync:stage-core" first.`);
    totalErrors++;
    continue;
  }

  // Check generated marker files
  const markerPath = path.join(target.dir, '.stage-core-generated');
  const manifestPath = path.join(target.dir, '.generated-manifest.json');
  if (!fs.existsSync(markerPath) || !fs.existsSync(manifestPath)) {
    console.error(`  ✗ ERROR: Target is missing generated marker metadata (.stage-core-generated)`);
    totalErrors++;
  }

  const targetFiles = getAllFiles(target.dir);
  const targetMap = new Map(targetFiles.map((f) => [f.relPath, f.fullPath]));

  for (const cFile of canonicalFiles) {
    const tFullPath = targetMap.get(cFile.relPath);
    if (!tFullPath) {
      console.error(`  ✗ MISSING: File "${cFile.relPath}" missing in ${target.name}!`);
      totalErrors++;
      continue;
    }

    const cHash = computeHash(cFile.fullPath);
    const tHash = computeHash(tFullPath);
    if (cHash !== tHash) {
      console.error(`  ✗ DIVERGENCE: File "${cFile.relPath}" differs between canonical and ${target.name}!`);
      totalErrors++;
    }
  }

  // Check for orphan files in target
  const canonRelSet = new Set(canonicalFiles.map((f) => f.relPath));
  for (const tFile of targetFiles) {
    if (!canonRelSet.has(tFile.relPath)) {
      console.error(`  ✗ ORPHAN: File "${tFile.relPath}" exists in ${target.name} but not in canonical source!`);
      totalErrors++;
    }
  }
}

if (totalErrors > 0) {
  console.error(`\n✗ VERIFICATION FAILED: ${totalErrors} issue(s) detected.`);
  console.error('  Stage-core assets have diverged or are out of sync.');
  console.error('  Fix: Edit only packages/ui-shared/src/features/stagex/stage-core and run "pnpm sync:stage-core".\n');
  process.exit(1);
}

console.log('\n----------------------------------------------------------------');
console.log('✓ SUCCESS: All stage-core files across Web and Android are 100% byte-identical');
console.log('  and synchronized with the authoritative source.');
console.log('================================================================\n');
