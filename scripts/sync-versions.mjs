import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// --- 1. Identify the Single Source of Truth ---
const rootPkgPath = path.join(repoRoot, 'package.json');
if (!fs.existsSync(rootPkgPath)) {
  console.error(`sync-versions: ✗ Critical Error: root package.json not found at ${rootPkgPath}`);
  process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const version = rootPkg.version;

if (!version || typeof version !== 'string') {
  console.error(`sync-versions: ✗ Critical Error: Invalid version in root package.json: ${version}`);
  process.exit(1);
}

const semverMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
if (!semverMatch) {
  console.error(`sync-versions: ✗ Critical Error: Version "${version}" is not valid strict SemVer (X.Y.Z)`);
  process.exit(1);
}

const major = parseInt(semverMatch[1], 10);
const minor = parseInt(semverMatch[2], 10);
const patch = parseInt(semverMatch[3], 10);
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`sync-versions: ✓ Read SSOT version: ${version} (Derived versionCode: ${versionCode})`);

// --- 2. Gather git and build metadata ---
let gitCommitSha = 'unknown';
try {
  gitCommitSha = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('sync-versions: ⚠ Could not get git commit SHA:', e.message);
}
const buildTimestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

// --- 3. Update all secondary package.json files ---
const secondaryPkgPaths = [
  path.join(repoRoot, 'apps/studio-android/package.json'),
  path.join(repoRoot, 'apps/studio-web/package.json')
];

for (const pkgPath of secondaryPkgPaths) {
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version !== version) {
      pkg.version = version;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`sync-versions: ✓ Synchronized ${path.relative(repoRoot, pkgPath)} to ${version}`);
    } else {
      console.log(`sync-versions: • ${path.relative(repoRoot, pkgPath)} is already ${version}`);
    }
  }
}

// --- 4. Update Android build.gradle ---
const gradlePath = path.join(repoRoot, 'apps/studio-android/android/app/build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradleSrc = fs.readFileSync(gradlePath, 'utf8');
  let updated = false;

  if (!gradleSrc.includes(`versionName "${version}"`)) {
    gradleSrc = gradleSrc.replace(/versionName\s+["']([^"']+)["']/, `versionName "${version}"`);
    updated = true;
  }
  if (!gradleSrc.includes(`versionCode ${versionCode}`)) {
    gradleSrc = gradleSrc.replace(/versionCode\s+(\d+)/, `versionCode ${versionCode}`);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(gradlePath, gradleSrc, 'utf8');
    console.log(`sync-versions: ✓ Synchronized build.gradle (versionName: ${version}, versionCode: ${versionCode})`);
  } else {
    console.log(`sync-versions: • build.gradle is already perfectly synchronized`);
  }
}

// --- 5. Update appVersion.ts ---
const appVersionTsPath = path.join(repoRoot, 'packages/studio-core/src/lib/startup/appVersion.ts');
if (fs.existsSync(appVersionTsPath)) {
  let src = fs.readFileSync(appVersionTsPath, 'utf8');
  let updated = false;

  const replacements = [
    { regex: /export\s+const\s+NATIVE_VERSION\s*=\s*['"]([^'"]+)['"]/, repl: `export const NATIVE_VERSION = '${version}'` },
    { regex: /export\s+const\s+NATIVE_VERSION_CODE\s*=\s*\d+/, repl: `export const NATIVE_VERSION_CODE = ${versionCode}` },
    { regex: /export\s+const\s+WEB_VERSION\s*=\s*['"]([^'"]+)['"]/, repl: `export const WEB_VERSION = '${version}'` },
    { regex: /export\s+const\s+APP_COMMIT_SHA\s*=\s*['"]([^'"]+)['"]/, repl: `export const APP_COMMIT_SHA = '${gitCommitSha}'` },
    { regex: /export\s+const\s+APP_BUILD_TIMESTAMP\s*=\s*['"]([^'"]+)['"]/, repl: `export const APP_BUILD_TIMESTAMP = '${buildTimestamp}'` }
  ];

  for (const { regex, repl } of replacements) {
    if (!src.includes(repl)) {
      src = src.replace(regex, repl);
      updated = true;
    }
  }

  // --- 6. Parse CHANGELOG.md for release notes and update appVersion.ts ---
  function cleanMojibake(str) {
    if (!str) return '';
    return str.replace(/â€¢/g, '•').replace(/â€‹/g, '').replace(/â€¦/g, '…')
      .replace(/â€”/g, '—').replace(/â€“/g, '–').replace(/â€™/g, "'")
      .replace(/â€\x9d/g, '"').replace(/â€\x9c/g, '"');
  }

  const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
  let changelogPayload = '';
  let releaseNotesPayload = {};
  
  if (fs.existsSync(changelogPath)) {
    const changelogText = cleanMojibake(fs.readFileSync(changelogPath, 'utf8'));
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

    if (!inSection || sectionLines.join('\n').trim().length === 0) {
      console.warn(`sync-versions: ⚠ Warning: Missing or empty changelog entry for version ${version} in CHANGELOG.md`);
    } else {
      const sectionContent = sectionLines.join('\n').trim();
      
      // Write release-notes.md for GitHub releases
      const releaseNotesMdPath = path.join(repoRoot, 'release-notes.md');
      fs.writeFileSync(releaseNotesMdPath, sectionContent + '\n', 'utf8');
      console.log(`sync-versions: ✓ Wrote release-notes.md from CHANGELOG.md`);

      const categories = { added: [], improved: [], fixed: [], changed: [] };
      let currentCategory = null;
      const flatBullets = [];

      for (const rawLine of sectionContent.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;
        const hMatch = line.match(/^###\s+(Added|Improved|Fixed|Changes|Bug\s*Fixes|Fixes|Changed)\b/i);
        if (hMatch) {
          const heading = hMatch[1].toLowerCase();
          if (heading.startsWith('add')) currentCategory = 'added';
          else if (heading.startsWith('improv')) currentCategory = 'improved';
          else if (heading.startsWith('fix') || heading.startsWith('bug')) currentCategory = 'fixed';
          else if (heading.startsWith('change')) currentCategory = 'changed';
          else currentCategory = null;
          continue;
        }
        const bMatch = line.match(/^[-*]\s+(.*)$/);
        if (bMatch) {
          const bulletContent = bMatch[1].trim();
          if (currentCategory) categories[currentCategory].push(bulletContent);
          flatBullets.push(bulletContent);
        }
      }

      changelogPayload = flatBullets.map((b) => `• ${b}`).join('\n');
      releaseNotesPayload = {
        added: categories.added.length > 0 ? categories.added : undefined,
        improved: categories.improved.length > 0 ? categories.improved : undefined,
        fixed: categories.fixed.length > 0 ? categories.fixed : undefined,
        changed: categories.changed.length > 0 ? categories.changed : undefined,
      };

      let tsSections = 'export const APP_CHANGELOG_SECTIONS: ChangelogSection[] = [\n';
      for (const [key, heading] of Object.entries({added: 'Added', improved: 'Improved', fixed: 'Fixed', changed: 'Changed'})) {
        if (categories[key].length > 0) {
          tsSections += `  {\n    heading: "${heading}",\n    items: [\n` +
            categories[key].map((i) => `      ${JSON.stringify(i)},`).join('\n') +
            '\n    ],\n  },\n';
        }
      }
      tsSections += '];';

      const changelogSectionsPat = /export\s+const\s+APP_CHANGELOG_SECTIONS:\s*ChangelogSection\[\]\s*=\s*\[([\s\S]*?)\]\s*;/;
      if (changelogSectionsPat.test(src)) {
        src = src.replace(changelogSectionsPat, tsSections);
        updated = true;
      }
    }
  }

  if (updated) {
    fs.writeFileSync(appVersionTsPath, src, 'utf8');
    console.log(`sync-versions: ✓ Synchronized appVersion.ts`);
  } else {
    console.log(`sync-versions: • appVersion.ts is already perfectly synchronized`);
  }

  // --- 7. Generate Manifests ---
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
    changelog: changelogPayload,
    whatsNew: changelogPayload,
    releaseNotes: releaseNotesPayload,
    mandatory: false,
  };

  const manifests = [
    { path: 'apps/studio-android/public/version.json', data: payload },
    { path: 'apps/studio-web/public/version.json', data: { ...payload, platform: 'web' } },
    { path: 'apps/studio-android/public/app-release.json', data: payload }
  ];

  for (const m of manifests) {
    const fullPath = path.join(repoRoot, m.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(m.data, null, 2) + '\n', 'utf8');
    console.log(`sync-versions: ✓ Wrote manifest ${m.path}`);
  }
}

// Update release-manifest.json if present
const releaseManifestPath = path.join(repoRoot, 'release-manifest.json');
if (fs.existsSync(releaseManifestPath)) {
  const rm = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));
  if (rm.releaseVersion !== version || rm.versionCode !== versionCode) {
    rm.releaseVersion = version;
    rm.versionName = version;
    rm.versionCode = versionCode;
    fs.writeFileSync(releaseManifestPath, JSON.stringify(rm, null, 2) + '\n', 'utf8');
    console.log(`sync-versions: ✓ Synchronized release-manifest.json`);
  }
}

console.log(`\n\x1b[32m=== SSOT VERSION SYNCHRONIZATION COMPLETE ===\x1b[0m\n`);
process.exit(0);
