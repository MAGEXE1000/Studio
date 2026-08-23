#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const distDir = path.join(repoRoot, 'dist', 'android-web');
const capAssetsDir = path.join(repoRoot, 'apps', 'studio-android', 'android', 'app', 'src', 'main', 'assets', 'public');

console.log('================================================================');
console.log('   CAPACITOR ASSETS FRESHNESS & INTEGRITY SAFEGUARD CHECK');
console.log('================================================================');

// 1. Verify build output directories exist
if (!fs.existsSync(distDir)) {
  console.error(`✗ ERROR: Vite build directory "${distDir}" does not exist! Run pnpm build first.`);
  process.exit(1);
}
if (!fs.existsSync(capAssetsDir)) {
  console.error(`✗ ERROR: Capacitor assets directory "${capAssetsDir}" does not exist! Run npx cap sync android first.`);
  process.exit(1);
}

// Helper to compute file hash
function computeHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Helper to get all files recursively
function getFiles(dir, relativeTo = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath);
    if (entry.isDirectory()) {
      results = results.concat(getFiles(fullPath, relativeTo));
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

// 2. Step 1: Compare Vite dist output against Capacitor public assets
console.log('Step 1: Checking that all Vite output files exist in Capacitor assets and match exactly...');
const distFiles = getFiles(distDir);
let mismatchCount = 0;
let missingCount = 0;

for (const file of distFiles) {
  const capFilePath = path.join(capAssetsDir, file.relPath);
  if (!fs.existsSync(capFilePath)) {
    console.error(`  - MISSING: "${file.relPath}" not found in Capacitor public assets!`);
    missingCount++;
    continue;
  }

  const distHash = computeHash(file.fullPath);
  const capHash = computeHash(capFilePath);

  if (distHash !== capHash) {
    console.error(`  - MISMATCH: "${file.relPath}" differs between Vite output and Capacitor assets!`);
    mismatchCount++;
  }
}

if (missingCount > 0 || mismatchCount > 0) {
  console.error(`\n✗ FAILURE: Capacitor assets are stale! Missing: ${missingCount}, Mismatched: ${mismatchCount}`);
  console.error('  Please run a clean build and sync:');
  console.error('  pnpm --filter @workspace/studio-android android:build\n');
  process.exit(1);
}
console.log('✓ SUCCESS: All Vite output files are identical to Capacitor assets.');

// 3. Step 2: Content Safeguard Verification
// Check if key updated strings are actually in the compiled bundles
console.log('\nStep 2: Performing content checks on built JS bundles...');

const jsFiles = distFiles.filter(f => f.relPath.endsWith('.js'));
if (jsFiles.length === 0) {
  console.error('✗ ERROR: No JavaScript bundles found in Vite output directory!');
  process.exit(1);
}

// Key signatures that MUST be present in the compiled code
const requiredSignatures = [
  { name: 'Support Email', pattern: 'stagecore.contact@gmail.com' },
  { name: 'Floating Header safe-area top inset', pattern: 'calc(env(safe-area-inset-top, 0px) + 10px)' },
  { name: 'Scene delete confirm notification', pattern: 'stage-core:confirm' }
];

const foundSignatures = {};
for (const sig of requiredSignatures) {
  foundSignatures[sig.name] = false;
}

for (const file of jsFiles) {
  const content = fs.readFileSync(file.fullPath, 'utf8');
  for (const sig of requiredSignatures) {
    if (content.includes(sig.pattern)) {
      foundSignatures[sig.name] = true;
      console.log(`  - Found "${sig.name}" signature in file: ${file.relPath}`);
    }
  }
}

let failedSignatureCheck = false;
for (const sig of requiredSignatures) {
  if (!foundSignatures[sig.name]) {
    console.error(`✗ ERROR: Required change "${sig.name}" ("${sig.pattern}") was not found in any compiled JS bundles!`);
    failedSignatureCheck = true;
  }
}

if (failedSignatureCheck) {
  console.error('\n✗ FAILURE: Compiled bundle is missing the requested UI/behavior changes!');
  console.error('  This indicates the modified source code was not successfully compiled by Vite.');
  console.error('  Check imports, routes, and build targets, then rebuild.');
  process.exit(1);
}

console.log('✓ SUCCESS: All required features verified in compiled JS assets.');
console.log('================================================================\n');
process.exit(0);
