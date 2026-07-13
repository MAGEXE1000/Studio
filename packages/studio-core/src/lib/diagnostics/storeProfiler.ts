import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { SourceMapResolver } from './SourceMapResolver';

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
      return (set as any)(...args as any);
    }

    const prevState = get() as any;
    const start = performance.now();
    
    // Call the original set
    (set as any)(...args as any);
    
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
  // Generate the raw stack synchronously (cheap), but defer parsing (expensive) to avoid blocking the main thread.
  const rawStack = new Error().stack;

  // We only log if it's taking a measurable amount of time to update subscribers (e.g. > 2ms)
  // Or if it's a critical store we want to trace all changes on.
  if (duration > 2.0) {
    Promise.resolve().then(() => {
      let caller = 'Unknown';
      let fileLocation = 'N/A';
      if (rawStack) {
        const lines = rawStack.split('\n');
        // Find the first line outside of zustand/storeProfiler
        for (let i = 2; i < lines.length; i++) {
          if (!lines[i].includes('zustand') && !lines[i].includes('storeProfiler')) {
            const parsed = SourceMapResolver.parseStackTrace(lines.slice(i).join('\n'));
            if (parsed.length > 0) {
              caller = parsed[0].func;
              fileLocation = `${parsed[0].file}:${parsed[0].line}`;
            } else {
              caller = lines[i].trim();
            }
            break;
          }
        }
      }

      const msg = `
--------------------------------
Store Update: ${storeName}
Duration: ${duration.toFixed(2)} ms
Caller: ${caller}
File: ${fileLocation}
Keys Changed: ${changes.join(', ')}
================================`;
      console.warn(msg);
    }).catch(e => {
       console.debug(`[storeProfiler] Error parsing stack trace:`, e);
    });
  } else {
    // Fast path debug logging for minor updates
    console.debug(`[storeProfiler] Store Update: ${storeName} | Keys: ${changes.join(', ')}`);
  }
}
