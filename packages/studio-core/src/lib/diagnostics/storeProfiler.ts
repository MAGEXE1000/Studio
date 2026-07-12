// storeProfiler.ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Profiler = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type ProfilerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const storeProfilerImpl: ProfilerImpl = (f, name) => (set, get, api) => {
  const storeName = name || 'AnonymousStore';

  const profiledSet: typeof set = (...args) => {
    if (typeof window === 'undefined' || !(window as any).__ENABLE_DIAGNOSTICS__) {
      return set(...args);
    }

    const prevState = get() as any;
    const start = performance.now();
    
    // Call the original set
    set(...args);
    
    const end = performance.now();
    const duration = end - start;
    const nextState = get() as any;

    const changes = getStoreDiff(prevState, nextState);
    if (changes.length > 0) {
      logStoreChange(storeName, changes, prevState, nextState, duration);
    }
  };

  return f(profiledSet, get, api);
};

export const diagnosticsMiddleware = storeProfilerImpl as unknown as Profiler;

function getStoreDiff(oldState: any, newState: any): string[] {
  const changes: string[] = [];
  if (!oldState || !newState) return changes;
  
  for (const key in newState) {
    if (oldState[key] !== newState[key]) {
      changes.push(key);
    }
  }
  return changes;
}

function logStoreChange(storeName: string, changes: string[], prevState: any, nextState: any, duration: number) {
  // Try to capture stack trace to see who called set()
  const err = new Error();
  let caller = 'Unknown';
  if (err.stack) {
    const lines = err.stack.split('\\n');
    // Find the first line outside of zustand/storeProfiler
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i].includes('zustand') && !lines[i].includes('storeProfiler')) {
        caller = lines[i].trim();
        break;
      }
    }
  }

  const msg = `
--------------------------------
Store Update: ${storeName}
Duration: ${duration.toFixed(2)} ms
Caller: ${caller}
Keys Changed: ${changes.join(', ')}
================================`;

  // We only log if it's taking a measurable amount of time to update subscribers (e.g. > 2ms)
  // Or if it's a critical store we want to trace all changes on.
  if (duration > 2.0) {
    console.warn(msg);
  } else {
    console.debug(msg);
  }
}
