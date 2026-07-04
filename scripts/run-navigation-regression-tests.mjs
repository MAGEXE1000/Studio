import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Setup mock window/document and localStorage for Zustand persist middleware
globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
};
globalThis.localStorage = globalThis.window.localStorage;

async function runNavigationTests() {
  console.log('=== STARTING AUTOMATED NAVIGATION REGRESSION TESTS ===');

  const results = [];
  const assertTest = (name, fn) => {
    try {
      fn();
      results.push({ name, status: 'PASS', details: 'Check passed successfully.' });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', details: err.message });
      console.error(`[FAIL] ${name}:`, err.message);
    }
  };

  const storePath = path.join(repoRoot, 'packages/studio-core/dist/src/store/useChordStore.js');
  const storeUrl = `file://${storePath.replace(/\\/g, '/')}`;
  const { useChordStore } = await import(storeUrl);

  // Helper to reset store state before each test
  const resetStore = () => {
    useChordStore.setState({
      navigationHistory: [{ app: 'hub', tab: 'home' }],
      activePanel: 'library',
      settings: { appMode: 'hub' },
    });
  };

  // Test 1: Initial Navigation State
  assertTest('Initial state is correct', () => {
    resetStore();
    const state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 1);
    assert.deepStrictEqual(state.navigationHistory[0], { app: 'hub', tab: 'home' });
    assert.strictEqual(state.settings.appMode, 'hub');
  });

  // Test 2: pushNav works and defaults pages/panels correctly
  assertTest('pushNav sets defaults and activePanel', () => {
    resetStore();
    const store = useChordStore.getState();

    // Push chords app mode
    store.pushNav({ app: 'chords' });
    let state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 2);
    assert.strictEqual(state.navigationHistory[1].app, 'chords');
    assert.strictEqual(state.navigationHistory[1].page, 'library');
    assert.strictEqual(state.settings.appMode, 'chords');
    assert.strictEqual(state.activePanel, 'library');

    // Push specific chords panel
    state.pushNav({ app: 'chords', page: 'chord' });
    state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 3);
    assert.strictEqual(state.navigationHistory[2].app, 'chords');
    assert.strictEqual(state.navigationHistory[2].page, 'chord');
    assert.strictEqual(state.activePanel, 'chord');
  });

  // Test 3: popNav works and restores activePanel
  assertTest('popNav pops stack and restores panel', () => {
    resetStore();
    const store = useChordStore.getState();

    store.pushNav({ app: 'chords' });
    store.pushNav({ app: 'chords', page: 'chord' });
    
    let state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 3);
    assert.strictEqual(state.activePanel, 'chord');

    store.popNav();
    state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 2);
    assert.strictEqual(state.navigationHistory[1].app, 'chords');
    assert.strictEqual(state.navigationHistory[1].page, 'library');
    assert.strictEqual(state.activePanel, 'library');

    store.popNav();
    state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 1);
    assert.deepStrictEqual(state.navigationHistory[0], { app: 'hub', tab: 'home' });
    assert.strictEqual(state.settings.appMode, 'hub');
  });

  // Test 4: pushNav deduplication prevents double pushes
  assertTest('pushNav deduplicates identical subsequent routes', () => {
    resetStore();
    const store = useChordStore.getState();

    store.pushNav({ app: 'chords', page: 'chord' });
    store.pushNav({ app: 'chords', page: 'chord' }); // identical
    
    const state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 2); // should be 2, not 3
  });

  // Test 5: replaceNav replaces top of stack
  assertTest('replaceNav replaces top stack item', () => {
    resetStore();
    const store = useChordStore.getState();

    store.pushNav({ app: 'chords' });
    store.replaceNav({ app: 'vocalex' });

    const state = useChordStore.getState();
    assert.strictEqual(state.navigationHistory.length, 2);
    assert.strictEqual(state.navigationHistory[1].app, 'vocalex');
    assert.strictEqual(state.navigationHistory[1].page, 'practice');
    assert.strictEqual(state.settings.appMode, 'vocalex');
  });

  console.log('\n=== REGRESSION TEST RESULTS ===');
  console.log('| Test Name | Status | Details |');
  console.log('|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.name} | ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.details} |`);
  }

  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    console.error(`\n❌ Navigation regression tests failed: ${failed.length} failures.`);
    process.exit(1);
  } else {
    console.log('\n✅ All navigation regression tests passed successfully!');
    process.exit(0);
  }
}

runNavigationTests().catch(err => {
  console.error('Test runner encountered an uncaught error:', err);
  process.exit(1);
});
