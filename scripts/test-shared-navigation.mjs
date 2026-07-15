import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// 1. Setup virtual time and frame mock system
let mockTimers = {};
let mockTimerId = 0;
let mockRafs = {};
let mockRafId = 0;

globalThis.setTimeout = (cb, delay) => {
  const id = ++mockTimerId;
  mockTimers[id] = { cb, delay };
  return id;
};

globalThis.clearTimeout = (id) => {
  delete mockTimers[id];
};

globalThis.requestAnimationFrame = (cb) => {
  const id = ++mockRafId;
  mockRafs[id] = cb;
  return id;
};

globalThis.cancelAnimationFrame = (id) => {
  delete mockRafs[id];
};

function flushRafs() {
  let limit = 10;
  while (Object.keys(mockRafs).length > 0 && limit-- > 0) {
    const currentRafs = { ...mockRafs };
    mockRafs = {};
    for (const id in currentRafs) {
      currentRafs[id]();
    }
  }
}

function advanceTime(ms) {
  const keys = Object.keys(mockTimers);
  for (const id of keys) {
    const timer = mockTimers[id];
    if (timer) {
      timer.delay -= ms;
      if (timer.delay <= 0) {
        delete mockTimers[id];
        timer.cb();
      }
    }
  }
}

// 2. Setup React hooks micro-runtime with loop re-render support
let hooks = [];
let hookIndex = 0;
let currentProps = null;
let currentRenderCount = 0;
let isUpdating = false;
let needsReRender = false;
let SharedNavigationContainer = null;

function renderComponent(props) {
  currentProps = props;
  triggerUpdate();
}

function triggerUpdate() {
  if (isUpdating) {
    needsReRender = true;
    return;
  }
  isUpdating = true;
  needsReRender = false;
  
  let loopCount = 0;
  do {
    needsReRender = false;
    hookIndex = 0;
    SharedNavigationContainer(currentProps);
    currentRenderCount++;
    
    // Run effects
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      if (hook.type === 'effect') {
        let shouldRun = false;
        if (hook.prevDeps === null) {
          shouldRun = true;
        } else {
          for (let j = 0; j < hook.deps.length; j++) {
            if (hook.deps[j] !== hook.prevDeps[j]) {
              shouldRun = true;
              break;
            }
          }
        }
        
        if (shouldRun) {
          if (typeof hook.cleanup === 'function') {
            hook.cleanup();
          }
          hook.cleanup = hook.cb();
          hook.prevDeps = [...hook.deps];
        }
      }
    }
    loopCount++;
    if (loopCount > 20) {
      throw new Error('Infinite loop detected in React mock hooks runtime');
    }
  } while (needsReRender);
  
  isUpdating = false;
}

const mockReact = {
  useState: (initialValue) => {
    const idx = hookIndex++;
    if (hooks[idx] === undefined) {
      let val = typeof initialValue === 'function' ? initialValue() : initialValue;
      hooks[idx] = {
        type: 'state',
        val,
        setter: (nextVal) => {
          let resolved = typeof nextVal === 'function' ? nextVal(hooks[idx].val) : nextVal;
          hooks[idx].val = resolved;
          triggerUpdate();
        }
      };
    }
    return [hooks[idx].val, hooks[idx].setter];
  },
  useEffect: (cb, deps) => {
    const idx = hookIndex++;
    if (hooks[idx] === undefined) {
      hooks[idx] = {
        type: 'effect',
        cb,
        deps,
        prevDeps: null,
        cleanup: null
      };
    } else {
      hooks[idx].cb = cb; // Make sure new closure is captured
      hooks[idx].deps = deps;
    }
  },
  useRef: (initialValue) => {
    const idx = hookIndex++;
    if (hooks[idx] === undefined) {
      hooks[idx] = {
        type: 'ref',
        current: initialValue
      };
    }
    return hooks[idx];
  },
  memo: (c) => c,
};

globalThis.mockReact = mockReact;

// 3. Mock global Navigation Store State
globalThis.mockNavigationStoreState = {
  transitionType: null,
};

async function runTests() {
  console.log('=== STARTING PROGRAMMATIC TRANSITION ENGINE VALIDATION ===');

  const containerModulePath = path.join(repoRoot, 'packages/ui-shared/dist/src/navigation/SharedNavigationContainer.js');
  const containerModuleUrl = `file://${containerModulePath.replace(/\\/g, '/')}`;
  
  const mod = await import(containerModuleUrl);
  SharedNavigationContainer = mod.SharedNavigationContainer;

  const viewOrder = ['tab1', 'tab2', 'tab3', 'tab4'];
  const childrenMock = (id) => `Content of ${id}`;

  const resetComponentState = (initialView) => {
    hooks = [];
    hookIndex = 0;
    currentRenderCount = 0;
    mockTimers = {};
    mockTimerId = 0;
    mockRafs = {};
    mockRafId = 0;
    globalThis.mockNavigationStoreState = { transitionType: null };
    renderComponent({
      activeView: initialView,
      viewOrder,
      children: childrenMock
    });
  };

  const getVisitedViews = () => hooks[0].val;
  const getViewStates = () => hooks[1].val;

  // Test 1: Initial Mount State
  console.log('Test 1: Initial mount state verification...');
  resetComponentState('tab1');
  assert.deepStrictEqual(Array.from(getVisitedViews()), ['tab1']);
  assert.deepStrictEqual(getViewStates(), { tab1: 'm3-nav-active' });
  console.log('✓ Initial mount state correct.');

  // Test 2: Single Transition & Direction
  console.log('Test 2: Single transition to the right (forward)...');
  renderComponent({
    activeView: 'tab2',
    viewOrder,
    children: childrenMock
  });
  
  // Transition should start: tab1 exits to left, tab2 enters from right
  assert.strictEqual(getViewStates().tab1, 'm3-nav-exit-left');
  assert.strictEqual(getViewStates().tab2, 'm3-nav-enter-right');
  
  // Flush Rafs to activate tab2 transition
  flushRafs();
  assert.strictEqual(getViewStates().tab2, 'm3-nav-active');
  assert.strictEqual(getViewStates().tab1, 'm3-nav-exit-left');
  
  // Advance time to complete transition (300ms)
  advanceTime(300);
  assert.strictEqual(getViewStates().tab1, 'm3-nav-hidden');
  assert.strictEqual(getViewStates().tab2, 'm3-nav-active');
  assert.deepStrictEqual(Array.from(getVisitedViews()), ['tab1', 'tab2']);
  console.log('✓ Single transition & direction verification successful.');

  // Test 3: Backward Transition
  console.log('Test 3: Backward transition verification...');
  renderComponent({
    activeView: 'tab1',
    viewOrder,
    children: childrenMock
  });
  assert.strictEqual(getViewStates().tab2, 'm3-nav-exit-right');
  assert.strictEqual(getViewStates().tab1, 'm3-nav-enter-left');
  flushRafs();
  assert.strictEqual(getViewStates().tab1, 'm3-nav-active');
  advanceTime(300);
  assert.strictEqual(getViewStates().tab2, 'm3-nav-hidden');
  console.log('✓ Backward transition verification successful.');

  // Test 4: Duplicate Switch Prevention
  console.log('Test 4: Duplicate switch click safety...');
  const renderCountBefore = currentRenderCount;
  renderComponent({
    activeView: 'tab1',
    viewOrder,
    children: childrenMock
  });
  // Switch to the same view should not change state classes
  assert.strictEqual(getViewStates().tab1, 'm3-nav-active');
  console.log('✓ Duplicate Switch ignored correctly.');

  // Test 5: Rapid Switches Stress Test
  console.log('Test 5: Rapid switches stress test (Tab 1 -> Tab 2 -> Tab 3 in 5ms)...');
  resetComponentState('tab1');
  
  // Move 1 -> 2
  renderComponent({
    activeView: 'tab2',
    viewOrder,
    children: childrenMock
  });
  assert.strictEqual(getViewStates().tab1, 'm3-nav-exit-left');
  assert.strictEqual(getViewStates().tab2, 'm3-nav-enter-right');
  
  // Quickly move to 3 before 1 -> 2 finishes
  renderComponent({
    activeView: 'tab3',
    viewOrder,
    children: childrenMock
  });
  
  // Tab 1 should be immediately set to hidden to prevent stacked overlaps
  assert.strictEqual(getViewStates().tab1, 'm3-nav-hidden');
  // Tab 2 (which was entering) is now exiting to the left
  assert.strictEqual(getViewStates().tab2, 'm3-nav-exit-left');
  // Tab 3 is entering from the right
  assert.strictEqual(getViewStates().tab3, 'm3-nav-enter-right');
  
  flushRafs();
  assert.strictEqual(getViewStates().tab3, 'm3-nav-active');
  
  advanceTime(300);
  assert.strictEqual(getViewStates().tab2, 'm3-nav-hidden');
  assert.strictEqual(getViewStates().tab3, 'm3-nav-active');
  console.log('✓ Rapid switches resolved cleanly without stacked components.');

  // Test 6: Memory Leak checks (Timers cleanup on unmount)
  console.log('Test 6: Cleanup on unmount validation...');
  resetComponentState('tab1');
  renderComponent({
    activeView: 'tab2',
    viewOrder,
    children: childrenMock
  });
  
  // Verify timer is set
  assert.ok(Object.keys(mockTimers).length > 0);
  assert.ok(Object.keys(mockRafs).length > 0);
  
  // Trigger cleanup effect
  const cleanupEffectIndex = 7;
  const cleanupFn = hooks[cleanupEffectIndex].cleanup;
  if (typeof cleanupFn === 'function') {
    cleanupFn();
  }
  
  // All frame schedules and timers should be cleared
  assert.strictEqual(Object.keys(mockRafs).length, 0);
  assert.strictEqual(Object.keys(mockTimers).length, 0);
  console.log('✓ Timer and Frame cleanup successful.');

  console.log('\x1b[32m=== ALL TRANSITION ENGINE UNIT VALIDATION TESTS PASSED ===\x1b[0m');
}

runTests().catch(err => {
  console.error('\x1b[31m=== TRANSITION ENGINE VALIDATION FAILED ===\x1b[0m');
  console.error(err.stack || err);
  process.exit(1);
});
