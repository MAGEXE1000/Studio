# Chordex Studio — Performance Optimization Guide

This document describes runtime efficiency standards, garbage collection, and React rendering rules.

---

## 1. React Rendering Optimizations

To maintain a fluid interface (60fps on mobile viewports), keep render cycles minimal:

### Memoization
* **`useMemo`**: Apply to computationally expensive operations, such as parsing arrays or filtering search queries.
  ```typescript
  const filteredTimeline = useMemo(() => {
    return stateTimeline.filter(t => t.message.includes(searchQuery));
  }, [stateTimeline, searchQuery]);
  ```
* **`useCallback`**: Apply to event handler callback methods passed as props to child components to prevent unnecessary child re-renders.

### Nested Definitions Avoidance
* Do not declare functional React components inside other functional components. React treats nested definitions as new component types on every render, tearing down and rebuilding the DOM. This causes input focus loss, UI flickering, and heavy rendering pipelines.

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`

---

## 2. State Store Selector Strategy

Do not import entire Zustand state objects into components. When you reference a store, use selective selector functions to only bind the specific variables needed. This ensures components only re-render when those specific values change:

* **Incorrect**:
  ```typescript
  const store = useChordStore(); // Re-renders component on ANY store mutation
  ```
* **Correct**:
  ```typescript
  const activeSong = useChordStore(state => state.activeSong); // Only re-renders when activeSong changes
  ```

Source:
* `packages/studio-core/src/store/useChordStore.ts`
* `packages/studio-core/src/store/useDrumStore.ts`

---

## 3. Dynamic Loading & Chunking

### Lazy Module Import
* Heavy external node modules or native bridge packages (e.g., pdf libraries, sharing bridges like `@capacitor/share`) should be imported dynamically inside execution scopes instead of at the file header:
  ```typescript
  const { Share } = await import('@capacitor/share');
  await Share.share({ title: 'Cached APK', url: filePath });
  ```

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`

### Rollup Manual Chunks (Aspirational / Future Recommendation)
* *Note*: The following chunking logic is recommended to split production bundles and eliminate chunk size warnings, but is not currently active in the default configuration files:
  ```typescript
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore']
        }
      }
    }
  }
  ```

---

## 4. Garbage Collection & Memory Leak Prevention

To prevent memory leaks:
* **Listener Removal**: Always remove listeners registered on windows, document nodes, or Capacitor native plugins in `useEffect` cleanups.
  ```typescript
  useEffect(() => {
    const handle = App.addListener('appStateChange', (state) => {
      console.log('App state changed to:', state);
    });
    return () => {
      handle.remove();
    };
  }, []);
  ```
* **Periodic Timers**: Clear all active `setInterval` or `setTimeout` processes in component unmount functions.

Source:
* `packages/studio-core/src/lib/capgoUpdater.ts`
