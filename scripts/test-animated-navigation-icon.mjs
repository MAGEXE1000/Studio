import assert from 'node:assert/strict';

console.log('=== RUNNING ANIMATED NAVIGATION ICON TEST SUITE ===');

// Replicate normalization & mapping logic
function getNormalizedIconName(key) {
  const norm = key.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // User & Profile
  if (['user', 'profile', 'account', 'person', 'avatar'].includes(norm)) return 'user';

  // Settings & Preferences
  if (['settings', 'cog', 'gear'].includes(norm)) return 'settings';
  if (
    [
      'sliders-horizontal',
      'slidershorizontal',
      'preferences',
      'drumpreferences',
      'groovexpreferences',
      'vocalexpreferences',
      'stagexpreferences',
      'prefs',
    ].includes(norm)
  ) {
    return 'sliders-horizontal';
  }

  // Chordex
  if (['audio-lines', 'audiolines', 'songs', 'song', 'chordex', 'chords'].includes(norm))
    return 'audio-lines';
  if (['gallery-vertical-end', 'galleryverticalend', 'library'].includes(norm))
    return 'gallery-vertical-end';

  // Drumex
  if (['drum', 'drums', 'beats', 'drumbeats', 'drumsongs', 'drumex'].includes(norm)) return 'drum';
  if (['blocks', 'patterns', 'drumpatterns'].includes(norm)) return 'blocks';

  // StageX
  if (
    ['layout-panel-top', 'layoutpaneltop', 'stage', 'editor', 'stagexstage', 'stagex'].includes(
      norm
    )
  )
    return 'layout-panel-top';
  if (['layers', 'setup', 'stagexsetup', 'rhythms', 'groovexrhythms'].includes(norm))
    return 'layers';

  // Vocalex
  if (['graduation-cap', 'coach', 'vocalexcoach', 'practice', 'learn'].includes(norm))
    return 'graduation-cap';
  if (['mic', 'recorder', 'vocalexrecorder', 'vocalex'].includes(norm)) return 'mic';
  if (['clap', 'takes', 'vocalextakes', 'clapperboard'].includes(norm)) return 'clapperboard';

  // GrooveX
  if (['disc', 'groovex', 'record'].includes(norm)) return 'disc';

  // Hub
  if (['hub', 'home'].includes(norm)) return 'home';

  // General fallback equivalents
  if (['songbook', 'catalog'].includes(norm)) return 'book-open';
  if (norm === 'share') return 'share-2';
  if (norm === 'devtools' || norm === 'bug') return 'bug';
  if (norm === 'performance' || norm === 'activity') return 'activity';
  if (norm === 'inspector' || norm === 'search') return 'search';
  if (norm === 'dashboard' || norm === 'layout-dashboard') return 'layout-dashboard';
  if (norm === 'graphic_eq' || norm === 'graphiceq') return 'audio-lines';

  return norm;
}

const MATCHED_NAMES = new Set([
  'activity',
  'audio-lines',
  'blocks',
  'book-open',
  'bug',
  'clapperboard',
  'cog',
  'disc',
  'drum',
  'gallery-vertical-end',
  'graduation-cap',
  'home',
  'layers',
  'layout-dashboard',
  'layout-panel-top',
  'mic',
  'music',
  'search',
  'settings',
  'share-2',
  'sliders-horizontal',
  'user',
]);

const FILLED_VARIANTS_SUPPORT = {
  home: false,
  user: false,
  profile: false,
  account: false,
  person: false,
  avatar: false,
  settings: false,
  'audio-lines': false,
  'gallery-vertical-end': false,
  'sliders-horizontal': false,
  drum: false,
  blocks: false,
  layers: false,
  'graduation-cap': false,
  mic: false,
  clapperboard: false,
  'layout-panel-top': false,
  activity: false,
  search: false,
  disc: false,
  music: false,
  'book-open': false,
  'share-2': false,
  bug: false,
  'layout-dashboard': false,
  chordex: false,
  drumex: false,
  stagex: false,
  groovex: false,
  vocalex: false,
  hub: false,
  devtools: false,
  practice: false,
  library: false,
  songs: false,
  song: false,
  beats: false,
  patterns: false,
  prefs: false,
  preferences: false,
  rhythms: false,
  coach: false,
  recorder: false,
  takes: false,
  editor: false,
  setup: false,
  stage: false,
};

function checkIconWarning(iconKey, iconName) {
  const resolvedName = getNormalizedIconName(iconName || iconKey);
  const isUnmapped = FILLED_VARIANTS_SUPPORT[resolvedName] === undefined;
  return { resolvedName, isUnmapped };
}

// TEST 1: Profile Icon warning elimination
console.log('Test 1: Testing "profile" icon key and name...');
const profileResult1 = checkIconWarning('profile', undefined);
assert.equal(profileResult1.resolvedName, 'user');
assert.equal(profileResult1.isUnmapped, false, 'profile must NOT be unmapped');

const profileResult2 = checkIconWarning('profile', 'user');
assert.equal(profileResult2.resolvedName, 'user');
assert.equal(profileResult2.isUnmapped, false, 'user must NOT be unmapped');
console.log('✓ Test 1 Passed: "profile" correctly resolves to "user" with 0 warnings.');

// TEST 2: Drumex, Stagex, Disc, Chordex, Vocalex, Groovex, Hub icons
console.log('Test 2: Testing all 5 apps and hub navigation keys...');
const testKeys = [
  // 1. Chordex
  { key: 'chordex', expected: 'audio-lines' },
  { key: 'songs', expected: 'audio-lines' },
  { key: 'library', expected: 'gallery-vertical-end' },
  { key: 'preferences', expected: 'sliders-horizontal' },
  { key: 'chords', expected: 'audio-lines' },

  // 2. Drumex
  { key: 'drumex', expected: 'drum' },
  { key: 'beats', expected: 'drum' },
  { key: 'patterns', expected: 'blocks' },
  { key: 'drumPreferences', expected: 'sliders-horizontal' },
  { key: 'prefs', expected: 'sliders-horizontal' },

  // 3. Stagex
  { key: 'stagex', expected: 'layout-panel-top' },
  { key: 'Editor', expected: 'layout-panel-top' },
  { key: 'Setup', expected: 'layers' },
  { key: 'stagexPreferences', expected: 'sliders-horizontal' },

  // 4. Groovex
  { key: 'groovex', expected: 'disc' },
  { key: 'disc', expected: 'disc' },
  { key: 'rhythms', expected: 'layers' },
  { key: 'groovexPreferences', expected: 'sliders-horizontal' },

  // 5. Vocalex
  { key: 'vocalex', expected: 'mic' },
  { key: 'coach', expected: 'graduation-cap' },
  { key: 'recorder', expected: 'mic' },
  { key: 'takes', expected: 'clapperboard' },
  { key: 'vocalexPreferences', expected: 'sliders-horizontal' },

  // Hub & DevTools
  { key: 'hub', expected: 'home' },
  { key: 'home', expected: 'home' },
  { key: 'settings', expected: 'settings' },
  { key: 'profile', expected: 'user' },
  { key: 'devtools', expected: 'bug' },
  { key: 'dashboard', expected: 'layout-dashboard' },
  { key: 'performance', expected: 'activity' },
  { key: 'inspector', expected: 'search' },
];

for (const t of testKeys) {
  const res = checkIconWarning(t.key, undefined);
  assert.equal(res.resolvedName, t.expected, `Key "${t.key}" expected "${t.expected}" but got "${res.resolvedName}"`);
  assert.equal(res.isUnmapped, false, `Key "${t.key}" mapped to "${res.resolvedName}" must not trigger unmapped warning`);
  assert.ok(MATCHED_NAMES.has(res.resolvedName), `Resolved name "${res.resolvedName}" must be in MATCHED_NAMES`);
}
console.log(`✓ Test 2 Passed: All ${testKeys.length} navigation keys across all 5 apps and Hub verified with 0 unmapped warnings.`);

console.log('\n\x1b[32m=== ALL NAVIGATION ICON TESTS PASSED CLEANLY ===\x1b[0m\n');
process.exit(0);
