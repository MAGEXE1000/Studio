#!/usr/bin/env node

/**
 * Architecture Documentation Validation Script
 *
 * Validates that all expected documentation files exist under docs/architecture/
 * and checks for broken internal links between documents.
 *
 * Usage: node docs/architecture/scripts/refresh-docs.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCS_DIR = resolve(__dirname, '..');

const EXPECTED_FILES = [
  'README.md',
  'overview.md',
  'navigation.md',
  'shared-ui.md',
  'android.md',
  'firebase.md',
  'updater.md',
  'chordex.md',
  'drumex.md',
  'stagex.md',
  'groovex.md',
  'vocalex.md',
  'performance.md',
  'release-pipeline.md',
  'dependency-graph.md',
  'technical-debt.md',
  'future-maintenance.md',
];

let errors = 0;
let warnings = 0;

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   Architecture Documentation Validation           ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log();

// 1. Check all expected files exist
console.log('─── Checking expected files ───');
for (const file of EXPECTED_FILES) {
  const fullPath = join(DOCS_DIR, file);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').length;
    const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
    console.log(
      `  ✅ ${file.padEnd(28)} ${lines.toString().padStart(4)} lines  ${sizeKB.padStart(6)} KB`
    );
  } else {
    console.log(`  ❌ ${file} — MISSING`);
    errors++;
  }
}
console.log();

// 2. Check for unexpected files
console.log('─── Checking for unexpected files ───');
const actualFiles = readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('.'));
const unexpected = actualFiles.filter((f) => !EXPECTED_FILES.includes(f));
if (unexpected.length === 0) {
  console.log('  ✅ No unexpected .md files found');
} else {
  for (const f of unexpected) {
    console.log(`  ⚠️  Unexpected file: ${f}`);
    warnings++;
  }
}
console.log();

// 3. Check internal links between documents
console.log('─── Checking internal links ───');
const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
let totalLinks = 0;
let brokenLinks = 0;

for (const file of EXPECTED_FILES) {
  const fullPath = join(DOCS_DIR, file);
  if (!existsSync(fullPath)) continue;

  const content = readFileSync(fullPath, 'utf-8');
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const [, linkText, linkTarget] = match;
    // Only check relative .md links (not http, not file://, not anchors)
    if (
      linkTarget.endsWith('.md') &&
      !linkTarget.startsWith('http') &&
      !linkTarget.startsWith('file://')
    ) {
      totalLinks++;
      const targetPath = resolve(dirname(fullPath), linkTarget);
      if (!existsSync(targetPath)) {
        console.log(`  ❌ ${file}: broken link to "${linkTarget}" (text: "${linkText}")`);
        brokenLinks++;
        errors++;
      }
    }
  }
}

if (brokenLinks === 0) {
  console.log(`  ✅ All ${totalLinks} internal links are valid`);
}
console.log();

// 4. Check that each document has a top-level heading
console.log('─── Checking document structure ───');
for (const file of EXPECTED_FILES) {
  const fullPath = join(DOCS_DIR, file);
  if (!existsSync(fullPath)) continue;

  const content = readFileSync(fullPath, 'utf-8');
  const firstLine = content.split('\n').find((l) => l.trim().length > 0);
  if (!firstLine || !firstLine.startsWith('#')) {
    console.log(`  ⚠️  ${file}: no top-level heading found`);
    warnings++;
  }
}
console.log('  ✅ Structure check complete');
console.log();

// Summary
console.log('═══════════════════════════════════════════════════');
if (errors === 0 && warnings === 0) {
  console.log('  ✅ All checks passed');
} else {
  if (errors > 0) console.log(`  ❌ ${errors} error(s) found`);
  if (warnings > 0) console.log(`  ⚠️  ${warnings} warning(s) found`);
}
console.log('═══════════════════════════════════════════════════');

process.exit(errors > 0 ? 1 : 0);
