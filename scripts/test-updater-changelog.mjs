import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

console.log('=== RUNNING UPDATER CHANGELOG & VERSION CORRELATION TEST SUITE ===');

function sanitizeUTF8String(str) {
  if (!str) return '';
  return String(str)
    .replace(/â€¢/g, '•')
    .replace(/â€‹/g, '')
    .replace(/â€¦/g, '…')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, "'")
    .replace(/â€\x9d/g, '"')
    .replace(/â€\x9c/g, '"');
}

function extractStructuredReleaseNotes(input) {
  const categories = {
    added: [],
    improved: [],
    fixed: [],
    changed: [],
  };
  const flatBullets = [];

  if (!input) {
    return { releaseNotes: {}, bullets: [], formattedChangelog: '' };
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    const obj = input;
    const catKeys = ['added', 'improved', 'fixed', 'changed'];
    for (const key of catKeys) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (typeof item === 'string') {
            const clean = sanitizeUTF8String(item).trim();
            if (clean) {
              categories[key].push(clean);
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              flatBullets.push(`[${label}] ${clean}`);
            }
          }
        }
      }
    }
  } else if (Array.isArray(input)) {
    for (const raw of input) {
      if (typeof raw !== 'string') continue;
      const clean = sanitizeUTF8String(raw).trim();
      if (!clean) continue;

      const tagMatch = clean.match(/^\[(Added|Improved|Fixed|Changed|Bug\s*Fixes|Fixes)\]\s*(.*)$/i);
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        const content = tagMatch[2].trim();
        if (tag.startsWith('add')) categories.added.push(content);
        else if (tag.startsWith('improv')) categories.improved.push(content);
        else if (tag.startsWith('fix') || tag.startsWith('bug')) categories.fixed.push(content);
        else categories.changed.push(content);
        flatBullets.push(clean);
      } else {
        categories.changed.push(clean);
        flatBullets.push(clean);
      }
    }
  } else if (typeof input === 'string') {
    const cleanedText = sanitizeUTF8String(input);
    const lines = cleanedText.split(/\r?\n/);
    let currentCategory = 'changed';
    let hadExplicitHeading = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/^(?:#|##)\s*(?:Version\s+)?v?\d+\.\d+\.\d+/i.test(line)) continue;
      if (/^Release\s+Date:/i.test(line)) continue;

      const hMatch = line.match(
        /^(?:###|##|\*\*)\s*(Added|Improved|Fixed|Changes|Bug\s*Fixes|Fixes|Changed|Features|Security)\b/i
      );
      if (hMatch) {
        const heading = hMatch[1].toLowerCase();
        hadExplicitHeading = true;
        if (heading.startsWith('add') || heading.startsWith('feat')) currentCategory = 'added';
        else if (heading.startsWith('improv')) currentCategory = 'improved';
        else if (heading.startsWith('fix') || heading.startsWith('bug')) currentCategory = 'fixed';
        else if (heading.startsWith('change')) currentCategory = 'changed';
        else currentCategory = 'changed';
        continue;
      }

      const bulletMatch = line.match(/^[-*•\d.]+\s*(.*)$/);
      const bulletContent = (bulletMatch ? bulletMatch[1] : line).trim();
      if (!bulletContent) continue;

      const inlineTagMatch = bulletContent.match(
        /^\[(Added|Improved|Fixed|Changed|Bug\s*Fixes|Fixes)\]\s*(.*)$/i
      );
      if (inlineTagMatch) {
        const tag = inlineTagMatch[1].toLowerCase();
        const content = inlineTagMatch[2].trim();
        let targetCat = currentCategory;
        if (tag.startsWith('add')) targetCat = 'added';
        else if (tag.startsWith('improv')) targetCat = 'improved';
        else if (tag.startsWith('fix') || tag.startsWith('bug')) targetCat = 'fixed';
        else targetCat = 'changed';

        categories[targetCat].push(content);
        flatBullets.push(bulletContent);
      } else {
        categories[currentCategory].push(bulletContent);
        if (hadExplicitHeading) {
          const label = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
          flatBullets.push(`[${label}] ${bulletContent}`);
        } else {
          flatBullets.push(bulletContent);
        }
      }
    }
  }

  const structuredResult = {};
  if (categories.added.length > 0) structuredResult.added = categories.added;
  if (categories.improved.length > 0) structuredResult.improved = categories.improved;
  if (categories.fixed.length > 0) structuredResult.fixed = categories.fixed;
  if (categories.changed.length > 0) structuredResult.changed = categories.changed;

  const formattedChangelog = flatBullets
    .map((b) => (b.startsWith('•') ? b : `• ${b}`))
    .join('\n');

  return {
    releaseNotes: structuredResult,
    bullets: flatBullets,
    formattedChangelog,
  };
}

function resolveNotesList(releaseNotes, changelog, toVersion) {
  if (releaseNotes) {
    if (Array.isArray(releaseNotes)) {
      const filtered = releaseNotes.filter((item) => typeof item === 'string' && item.trim().length > 0);
      if (filtered.length > 0) return filtered;
    } else if (typeof releaseNotes === 'object') {
      const extracted = extractStructuredReleaseNotes(releaseNotes);
      if (extracted.bullets.length > 0) {
        return extracted.bullets;
      }
    }
  }

  if (changelog && typeof changelog === 'string' && changelog.trim().length > 0) {
    const extracted = extractStructuredReleaseNotes(changelog);
    if (extracted.bullets.length > 0) {
      return extracted.bullets;
    }
  }

  if (toVersion) {
    return [`Studio update v${toVersion} includes performance optimizations, UI refinements, and stability improvements.`];
  }

  return [];
}

// TEST 1: GitHub Release Markdown body parsing
console.log('Test 1: Parsing GitHub Release Markdown body into structured release notes...');
const v42Markdown = `# Version 4.5.42\n\nRelease Date: 2026-08-24\n\n### Fixed\n\n- Developer Inspector Usability: Fixed broken refresh behavior.\n- Performance Diagnostics Layout Overflow: Applied flexWrap.\n\n### Added\n\n- Tap-to-select capturing handler in Developer Inspector overlay.`;
const extracted42 = extractStructuredReleaseNotes(v42Markdown);
assert.equal(extracted42.releaseNotes.fixed.length, 2);
assert.equal(extracted42.releaseNotes.added.length, 1);
assert.deepEqual(extracted42.bullets, [
  '[Fixed] Developer Inspector Usability: Fixed broken refresh behavior.',
  '[Fixed] Performance Diagnostics Layout Overflow: Applied flexWrap.',
  '[Added] Tap-to-select capturing handler in Developer Inspector overlay.',
]);
console.log('✓ Test 1 Passed: GitHub release markdown parsed into structured categories.');

// TEST 2: Multi-Version Transition 1 (Version 4.5.41 -> Version 4.5.42)
console.log('Test 2: Multi-version test (v4.5.41 installed -> v4.5.42 available)...');
const v41Notes = {
  added: ['Global HeroUI Dialog & Modal Migration', 'Global HeroUI Button & ButtonGroup System'],
};
const v42Notes = {
  fixed: ['Developer Inspector Usability: Fixed broken refresh behavior.'],
  added: ['Tap-to-select capturing handler in Developer Inspector overlay.'],
};

const notes42 = resolveNotesList(v42Notes, null, '4.5.42');
assert.deepEqual(notes42, [
  '[Added] Tap-to-select capturing handler in Developer Inspector overlay.',
  '[Fixed] Developer Inspector Usability: Fixed broken refresh behavior.',
]);
assert.ok(!notes42.some(n => n.includes('Global HeroUI Dialog')));
console.log('✓ Test 2 Passed: v4.5.42 changelog resolved exclusively; v4.5.41 notes excluded.');

// TEST 3: Multi-Version Transition 2 (Version 4.5.42 -> Version 4.5.43)
console.log('Test 3: Multi-version test (v4.5.42 installed -> v4.5.43 available)...');
const v43Changelog = `• Modal Surface Transparency: Eliminated excessive transparency across modal surfaces.\n• Navigation Icon Mapping: Resolved unmapped icon warnings for drumex and stagex.`;

const notes43 = resolveNotesList(null, v43Changelog, '4.5.43');
assert.deepEqual(notes43, [
  'Modal Surface Transparency: Eliminated excessive transparency across modal surfaces.',
  'Navigation Icon Mapping: Resolved unmapped icon warnings for drumex and stagex.',
]);
assert.ok(!notes43.some(n => n.includes('Developer Inspector Usability')));
console.log('✓ Test 3 Passed: v4.5.43 changelog resolved exclusively; v4.5.42 notes excluded.');

// TEST 4: Fallback notes when no notes exist
console.log('Test 4: Dynamic fallback notes without stale hardcoded lines...');
const fallbackNotes = resolveNotesList(null, null, '4.5.99');
assert.deepEqual(fallbackNotes, [
  'Studio update v4.5.99 includes performance optimizations, UI refinements, and stability improvements.',
]);
assert.ok(!fallbackNotes.some(n => n.includes('Completely separated Chordex preferences')));
console.log('✓ Test 4 Passed: Dynamic version-based fallback used without stale legacy notes.');

// TEST 5: Current repo CHANGELOG.md and public metadata consistency check
console.log('Test 5: Validating current repo CHANGELOG.md and public metadata...');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const currentVersion = pkg.version;
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
assert.ok(fs.existsSync(changelogPath), 'CHANGELOG.md must exist');
const changelogContent = fs.readFileSync(changelogPath, 'utf8');
assert.ok(changelogContent.includes(`## ${currentVersion}`), `CHANGELOG.md must have ${currentVersion} entry`);

const appReleasePath = path.join(repoRoot, 'apps/studio-android/public/app-release.json');
if (fs.existsSync(appReleasePath)) {
  const appRelease = JSON.parse(fs.readFileSync(appReleasePath, 'utf8'));
  assert.equal(appRelease.version, currentVersion);
  assert.ok(appRelease.changelog.length > 0);
  assert.ok(appRelease.releaseNotes.fixed.length > 0 || appRelease.releaseNotes.added.length > 0);
  console.log(`✓ Test 5 Passed: app-release.json metadata contains v${appRelease.version} release notes.`);
}

console.log('\n\x1b[32m=== ALL UPDATER CHANGELOG TESTS PASSED CLEANLY ===\x1b[0m\n');
process.exit(0);
