#!/usr/bin/env node
/**
 * sync-version — keeps `public/version.json` in lockstep with the
 * bundle's `APP_VERSION` (and `APP_CHANGELOG`) so the two cannot
 * drift. Run automatically before every `vite build` via the
 * `prebuild` npm hook; safe to run by hand too.
 *
 * Source of truth:  CHANGELOG.md (repo root) & src/lib/appVersion.ts
 * Generates:        public/version.json     ({ version, changelog, releaseNotes, mandatory })
 *                   repo-root/release-notes.md (Markdown release notes)
 * Updates:          src/lib/appVersion.ts   (APP_CHANGELOG_SECTIONS)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '../..');
const sourcePath = path.join(repoRoot, 'packages/studio-core/src/lib/startup/appVersion.ts');
const outPath = path.join(root, 'public/version.json');

const preserveNewer = process.argv.includes('--preserve-newer');

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function semverGt(a, b) {
  const x = parseSemver(a),
    y = parseSemver(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) {
    if (x[i] > y[i]) return true;
    if (x[i] < y[i]) return false;
  }
  return false;
}

// 1. Synchronize CHANGELOG.md from repo root if present
const rootChangelogPath = path.join(repoRoot, 'CHANGELOG.md');
const localChangelogPath = path.join(root, 'CHANGELOG.md');
if (fs.existsSync(rootChangelogPath)) {
  fs.copyFileSync(rootChangelogPath, localChangelogPath);
  console.log(`sync-version: ✓ synchronized local CHANGELOG.md from repo root`);
}

// 2. Get version from src/lib/appVersion.ts
let src = fs.readFileSync(sourcePath, 'utf8');

let gitCommitSha = 'unknown';
try {
  gitCommitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('sync-version: ⚠ Could not get git commit SHA:', e.message);
}
const buildTimestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

src = src.replace(
  /export\s+const\s+APP_COMMIT_SHA\s*=\s*['"]([^'"]+)['"]/,
  `export const APP_COMMIT_SHA = '${gitCommitSha}'`
);
src = src.replace(
  /export\s+const\s+APP_BUILD_TIMESTAMP\s*=\s*['"]([^'"]+)['"]/,
  `export const APP_BUILD_TIMESTAMP = '${buildTimestamp}'`
);

const versionMatch = src.match(/export\s+const\s+NATIVE_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!versionMatch) {
  console.error(`sync-version: ✗ could not find NATIVE_VERSION in ${sourcePath}`);
  console.error("  Expected:  export const NATIVE_VERSION = 'X.Y.Z';");
  process.exit(1);
}
const version = versionMatch[1];

// Parse versionCode from build.gradle
let versionCode = 0;
try {
  const gradlePath = path.join(root, 'android/app/build.gradle');
  if (fs.existsSync(gradlePath)) {
    const gradleSrc = fs.readFileSync(gradlePath, 'utf8');
    const codeMatch = gradleSrc.match(/versionCode\s+(\d+)/);
    if (codeMatch) {
      versionCode = parseInt(codeMatch[1], 10);
    }
  }
} catch (err) {
  console.warn('sync-version: ⚠ Could not parse versionCode from build.gradle:', err);
}

// 3. Open and parse CHANGELOG.md
if (!fs.existsSync(localChangelogPath)) {
  console.error(`sync-version: ✗ Release blocked: CHANGELOG.md not found at ${localChangelogPath}`);
  process.exit(1);
}

function cleanMojibake(str) {
  if (!str) return '';
  return str
    .replace(/â€¢/g, '•')
    .replace(/â€‹/g, '')
    .replace(/â€¦/g, '…')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, "'")
    .replace(/â€\x9d/g, '"')
    .replace(/â€\x9c/g, '"');
}

const changelogText = cleanMojibake(fs.readFileSync(localChangelogPath, 'utf8'));
const changelogRawLines = changelogText.split(/\r?\n/);
let inSection = false;
let sectionLines = [];

for (const rawLine of changelogRawLines) {
  const isHeader = rawLine.match(/^(?:#|##)\s+(?:Version\s+)?v?(\d+\.\d+\.\d+)/i);
  if (isHeader) {
    if (inSection) break;
    if (isHeader[1] === version) {
      inSection = true;
      continue;
    }
  }
  if (inSection) {
    sectionLines.push(rawLine);
  }
}

if (!inSection) {
  console.error(
    `\x1b[31msync-version: ✗ Release blocked: missing changelog entry for version ${version} in CHANGELOG.md. Add real release notes before publishing.\x1b[0m`
  );
  process.exit(1);
}

const sectionContent = sectionLines.join('\n').trim();
if (!sectionContent) {
  console.error(
    `\x1b[31msync-version: ✗ Release blocked: changelog entry for version ${version} is empty. Add real release notes before publishing.\x1b[0m`
  );
  process.exit(1);
}

if (
  sectionContent.toLowerCase() === `version ${version}`.toLowerCase() ||
  sectionContent.toLowerCase() === `release v${version}`.toLowerCase() ||
  sectionContent.toLowerCase() === `version: ${version}`.toLowerCase()
) {
  console.error(
    `\x1b[31msync-version: ✗ Release blocked: changelog entry for version ${version} contains only generic placeholder text. Add real release notes before publishing.\x1b[0m`
  );
  process.exit(1);
}

// Extract bullets and structure by category (Added, Improved, Fixed, Changed)
const categories = {
  added: [],
  improved: [],
  fixed: [],
  changed: [],
};

const lines = sectionContent.split('\n');
let currentCategory = null;
const flatBullets = [];

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line) continue;

  // Detect category headings
  const hMatch = line.match(/^###\s+(Added|Improved|Fixed|Changes|Bug\s*Fixes|Fixes|Changed)\b/i);
  if (hMatch) {
    const heading = hMatch[1].toLowerCase();
    if (heading.startsWith('add')) {
      currentCategory = 'added';
    } else if (heading.startsWith('improv')) {
      currentCategory = 'improved';
    } else if (heading.startsWith('fix') || heading.startsWith('bug')) {
      currentCategory = 'fixed';
    } else if (heading.startsWith('change')) {
      currentCategory = 'changed';
    } else {
      currentCategory = null;
    }
    continue;
  }

  // Detect bullets starting with - or *
  const bMatch = line.match(/^[-*]\s+(.*)$/);
  if (bMatch) {
    const bulletContent = bMatch[1].trim();
    if (currentCategory) {
      categories[currentCategory].push(bulletContent);
    }
    flatBullets.push(bulletContent);
  }
}

if (flatBullets.length === 0) {
  console.error(
    `\x1b[31msync-version: ✗ Release blocked: changelog entry for version ${version} has no meaningful bullet points. Add real release notes before publishing.\x1b[0m`
  );
  process.exit(1);
}

const changelog = flatBullets.map((b) => `• ${b}`).join('\n');
const releaseNotes = {
  added: categories.added.length > 0 ? categories.added : undefined,
  improved: categories.improved.length > 0 ? categories.improved : undefined,
  fixed: categories.fixed.length > 0 ? categories.fixed : undefined,
  changed: categories.changed.length > 0 ? categories.changed : undefined,
};

console.log(
  `sync-version: ✓ Validated changelog for version ${version}. Found ${flatBullets.length} bullets.`
);

// 4. Write to release-notes.md in repo root for GitHub Release usage
const releaseNotesMdPath = path.join(repoRoot, 'release-notes.md');
fs.writeFileSync(releaseNotesMdPath, sectionContent + '\n', 'utf8');
console.log(`sync-version: ✓ Wrote repo-root/release-notes.md`);

// 5. Rewrite APP_CHANGELOG_SECTIONS in src/lib/appVersion.ts
let tsSections = 'export const APP_CHANGELOG_SECTIONS: ChangelogSection[] = [\n';
if (categories.added.length > 0) {
  tsSections +=
    '  {\n    heading: "Added",\n    items: [\n' +
    categories.added.map((i) => `      ${JSON.stringify(i)},`).join('\n') +
    '\n    ],\n  },\n';
}
if (categories.improved.length > 0) {
  tsSections +=
    '  {\n    heading: "Improved",\n    items: [\n' +
    categories.improved.map((i) => `      ${JSON.stringify(i)},`).join('\n') +
    '\n    ],\n  },\n';
}
if (categories.fixed.length > 0) {
  tsSections +=
    '  {\n    heading: "Fixed",\n    items: [\n' +
    categories.fixed.map((i) => `      ${JSON.stringify(i)},`).join('\n') +
    '\n    ],\n  },\n';
}
if (categories.changed.length > 0) {
  tsSections +=
    '  {\n    heading: "Changed",\n    items: [\n' +
    categories.changed.map((i) => `      ${JSON.stringify(i)},`).join('\n') +
    '\n    ],\n  },\n';
}
tsSections += '];';

const changelogSectionsPat =
  /export\s+const\s+APP_CHANGELOG_SECTIONS:\s*ChangelogSection\[\]\s*=\s*\[([\s\S]*?)\]\s*;/;
let finalSrc = src;
if (changelogSectionsPat.test(src)) {
  finalSrc = src.replace(changelogSectionsPat, tsSections);
  console.log(
    `sync-version: ✓ updated APP_CHANGELOG_SECTIONS in ${path.relative(root, sourcePath)}`
  );
} else {
  console.warn(`sync-version: ⚠ Could not find APP_CHANGELOG_SECTIONS pattern in ${sourcePath}`);
}

fs.writeFileSync(sourcePath, finalSrc, 'utf8');
console.log(
  `sync-version: ✓ updated APP_COMMIT_SHA and APP_BUILD_TIMESTAMP in ${path.relative(root, sourcePath)}`
);

const payload = {
  platform: 'android',
  version,
  versionName: version,
  versionCode,
  version_code: versionCode,
  commit: gitCommitSha,
  releasedAt: buildTimestamp,
  buildTimestamp,
  updateMode: 'refresh',
  changelog,
  whatsNew: changelog,
  releaseNotes,
  mandatory: false,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });

if (preserveNewer && fs.existsSync(outPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    if (existing && typeof existing.version === 'string' && semverGt(existing.version, version)) {
      console.log(
        `sync-version: ↷ kept existing ${path.relative(root, outPath)} (version=${existing.version} > APP_VERSION=${version}) — dev OTA override.`
      );
      process.exit(0);
    }
  } catch {
    /* malformed file — fall through and rewrite */
  }
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`sync-version: ✓ wrote ${path.relative(root, outPath)} (version=${version})`);

// Sync package.json across all workspace packages (root, web, android)
const targetsToSync = [
  path.join(repoRoot, 'package.json'),
  path.join(repoRoot, 'apps/studio-android/package.json'),
  path.join(repoRoot, 'apps/studio-web/package.json'),
];

targetsToSync.forEach((targetPkgPath) => {
  if (fs.existsSync(targetPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
      if (pkg.version !== version) {
        pkg.version = version;
        fs.writeFileSync(targetPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
        console.log(`sync-version: ✓ updated ${path.relative(repoRoot, targetPkgPath)} version to ${version}`);
      }
    } catch (err) {
      console.error(`sync-version: ✗ failed to sync ${targetPkgPath}:`, err);
    }
  }
});

// Also write web version.json if web public dir exists
const webOutPath = path.join(repoRoot, 'apps/studio-web/public/version.json');
try {
  fs.mkdirSync(path.dirname(webOutPath), { recursive: true });
  fs.writeFileSync(webOutPath, JSON.stringify({ ...payload, platform: 'web' }, null, 2) + '\n', 'utf8');
  console.log(`sync-version: ✓ synchronized web version.json to ${version}`);
} catch (err) {
  console.warn('sync-version: ⚠ Could not write web version.json:', err);
}

// Sync app-release.json if present
const appReleasePath = path.join(repoRoot, 'apps/studio-android/public/app-release.json');
if (fs.existsSync(appReleasePath)) {
  try {
    const arj = JSON.parse(fs.readFileSync(appReleasePath, 'utf8'));
    arj.version = version;
    arj.versionName = version;
    arj.versionCode = versionCode;
    fs.writeFileSync(appReleasePath, JSON.stringify(arj, null, 2) + '\n', 'utf8');
    console.log(`sync-version: ✓ updated app-release.json version to ${version}`);
  } catch (err) {
    console.warn('sync-version: ⚠ Could not update app-release.json:', err);
  }
}

// Sync release-manifest.json if present
const releaseManifestPath = path.join(repoRoot, 'release-manifest.json');
if (fs.existsSync(releaseManifestPath)) {
  try {
    const rm = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));
    rm.releaseVersion = version;
    rm.versionName = version;
    rm.versionCode = versionCode;
    fs.writeFileSync(releaseManifestPath, JSON.stringify(rm, null, 2) + '\n', 'utf8');
    console.log(`sync-version: ✓ updated release-manifest.json version to ${version}`);
  } catch (err) {
    console.warn('sync-version: ⚠ Could not update release-manifest.json:', err);
  }
}

// Sync android/app/build.gradle versionName and versionCode
const gradlePath = path.join(root, 'android/app/build.gradle');
if (fs.existsSync(gradlePath)) {
  try {
    let gradleSrc = fs.readFileSync(gradlePath, 'utf8');
    const existingCodeMatch = gradleSrc.match(/versionCode\s+(\d+)/);
    const vParts = parseSemver(version);
    const codeToUse = existingCodeMatch ? parseInt(existingCodeMatch[1], 10) : (vParts[0] * 10000 + vParts[1] * 100 + vParts[2]);

    gradleSrc = gradleSrc.replace(/versionName\s+["']([^"']+)["']/, `versionName "${version}"`);
    fs.writeFileSync(gradlePath, gradleSrc, 'utf8');
    console.log(`sync-version: ✓ updated android/app/build.gradle (versionName: ${version}, versionCode: ${codeToUse})`);
  } catch (err) {
    console.error('sync-version: ✗ failed to sync android/app/build.gradle:', err);
  }
}
