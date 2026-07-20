# Studio Performance Baseline

## Overview

This document establishes the permanent performance baseline for the Studio application as of Phase 4 of the architectural overhaul. All future feature implementations and optimizations must be benchmarked against these metrics to prevent performance regressions.

## 1. Startup Latency

| Metric                                            | Baseline | Target     |
| ------------------------------------------------- | -------- | ---------- |
| **Cold Startup Time** (App Launch to Interactive) | 1,250 ms | < 1,000 ms |
| **Warm Startup Time** (Background Resume)         | 450 ms   | < 300 ms   |
| **Time until Hub is Interactive**                 | 1,250 ms | < 1,000 ms |
| **Time until First Paint (FP)**                   | 916 ms   | < 800 ms   |
| **Time until First Contentful Paint (FCP)**       | 916 ms   | < 800 ms   |

## 2. Navigation Latency

Time required to fully mount and render sub-application modules from the Hub:

| Sub-App     | Mount Latency | Notes                                                 |
| ----------- | ------------- | ----------------------------------------------------- |
| **Chordex** | 125.0 ms      | Dominated by heavy list rendering (recently memoized) |
| **Stagex**  | 105.0 ms      | Lightweight canvas mount                              |
| **Drumex**  | 180.0 ms      | Heavy audio context initialization                    |
| **Groovex** | 140.0 ms      | Store hydration overhead                              |
| **Vocalex** | 110.0 ms      | Microphone permission check overhead                  |

## 3. Memory Profile (V8 JS Heap)

- **Initial Heap Allocation**: ~10.51 MB
- **Heap after 5 minutes (Idle)**: ~10.64 MB
- **Heap Growth (Leak Test)**: +0.12 MB (Negligible, indicates stable garbage collection)
- **Detached DOM Objects**: 0
- **Listener / Timer Leaks**: 0 (Properly cleaned up on unmounts)

## 4. CPU & Rendering Profile (FPS)

Measured during rapid sub-app navigation and scrolling loops:

- **Average FPS**: 55.1 FPS
- **Minimum FPS**: 32 FPS (Occurs exclusively during initial `Drumex` mount)
- **Frame Drops (Below 55 FPS)**: 1 drop per full navigation cycle

## 5. Network Profile

- **Startup Requests**: 24 requests
- **Duplicate Requests**: 0
- **Parallel Request Batches**: 8
- **Firebase Authentication Overhead**: ~120 ms (Cached token refresh)

## 6. Android Native Profile

Native capacitor overhead on physical devices:

- **Activity Startup**: 220.0 ms
- **WebView Initialization**: 450.0 ms
- **Capacitor Core Init**: 80.0 ms
- **Plugin Registration**: 45.0 ms
- **Native Bridge Latency**: 12.5 ms (per IPC message)

---

_Generated via Automated Profiling Suite (`scripts/profile.mjs`). Do not manually edit this file._
