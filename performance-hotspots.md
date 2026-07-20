# Studio Performance Hotspots

## Overview

This document outlines the top performance bottlenecks identified during the Phase 4 profiling audit. These hotspots are prioritized based on their impact on frame drops, reconciliation costs, and main thread blocking time.

All future performance optimization PRs should target an item on this list.

## High Priority Hotspots (Critical Path)

### 1. `Drumex` Audio Context Initialization

- **Location**: `apps/studio-web/src/features/drumex/AudioEngine.ts`
- **Why it is expensive**: Instantiating the Web Audio API context and decoding default drum samples synchronously blocks the main thread during component mount.
- **Measured Cost**: ~180ms UI freeze upon opening Drumex; triggers frame drop to 32 FPS.
- **Expected Gain**: Reduce mount latency to < 50ms by deferring audio decoding to a Web Worker or non-blocking async initializer.
- **Estimated Risk**: High (Audio playback synchronization depends on precise context timing).

### 2. `Groovex` Store Hydration

- **Location**: `packages/studio-core/src/store/useGroovexStore.ts`
- **Why it is expensive**: Deserializes a massive amount of cached groove presets from `localStorage` synchronously during the first mount.
- **Measured Cost**: ~140ms mount latency.
- **Expected Gain**: Reduce to < 20ms by implementing lazy hydration (rendering skeleton loaders while parsing JSON asynchronously).
- **Estimated Risk**: Medium (Requires handling null states in UI components that currently expect synchronous data).

## Medium Priority Hotspots

### 3. Context Propagation in `ThemeProvider`

- **Location**: `packages/ui-shared/src/providers/ThemeProvider.tsx`
- **Why it is expensive**: Frequent updates to CSS custom properties trigger deep React context cascades and browser style recalculations.
- **Measured Cost**: 45ms commit time during theme toggles.
- **Expected Gain**: Eliminate context cascading by injecting CSS variables directly into the document root bypassing React reconciliation.
- **Estimated Risk**: Low.

### 4. `Stagex` Canvas Resize Observer

- **Location**: `packages/ui-shared/src/features/stagex/StageCanvas.tsx`
- **Why it is expensive**: The `ResizeObserver` callback triggers React state updates on every sub-pixel container adjustment, causing infinite render loops during window resizing.
- **Measured Cost**: Up to 60 renders per second during resize events.
- **Expected Gain**: Implement a 100ms debounce on the observer callback.
- **Estimated Risk**: Low.

## Low Priority Hotspots

### 5. Excessive Network Requests on Hub Mount

- **Location**: `packages/ui-shared/src/features/hub/HubPanel.tsx`
- **Why it is expensive**: Fires 8 parallel Firebase database reads for user statistics, recent songs, and notifications instead of utilizing a single batch query.
- **Measured Cost**: High network connection overhead (24 total startup requests).
- **Expected Gain**: Combine queries into a single Firebase Edge Function call, reducing round trips.
- **Estimated Risk**: Medium (Requires backend architecture adjustments).
