# Chordex Studio — Development Roadmap

This document outlines active development goals, short-term milestones, and long-term feature releases.

---

## 1. Project Milestone Tracker

```
   [MVP Release]          [UI Modernization]        [Low-Latency Native]       [Multiplayer Jam]
   (v3.6.0 - Done)    ───>  (v3.7.56 - Active)  ───>     (Short-Term)     ───>    (Long-Term)
```

| Phase | Milestone | Focus Areas | Target Release | Status |
|---|---|---|---|---|
| **Phase 1** | **MVP App Core** | Basic Chords discovery, WebAudio playback, firebase sync | `v3.6.0` | **Completed** |
| **Phase 2** | **UI & Diagnostics**| Material 3 design, touch-safety fixes, OTA diagnostic lab | `v3.7.56` | **Active** |
| **Phase 3** | **Audio Optimizations**| Integration of low-latency native audio engines | `v3.8.0` | **Planned** |
| **Phase 4** | **Real-time Jamming**| Multi-client websocket audio synchronization | `v3.9.0` | **Planned** |

Source:
* `CHANGELOG.md`

---

## 2. Milestone Focus Details

### Short-Term: Offline Storage & Diagnostic Enhancements
* **Persistent Logs Database**: Replace in-memory diagnostics log arrays with a persistent local log storage engine in `@workspace/studio-core` to inspect console traces post-app crash.
* **Auto-Scroll Customization**: Enhance console viewport with line search patterns and regex filters.

### Medium-Term: Native Low-Latency Audio (Android Oboe / AAudio)
* **Problem**: The Android WebView WebAudio engine suffers from latency (approx. 40ms to 70ms), making real-time vocal monitoring and precise drum pad taps slightly delayed.
* **Solution**: Write a native C++ audio rendering plugin using Google's Oboe library, bridging audio streams directly to the low-latency AAudio driver.

### Long-Term: Real-Time Jam Session Sync
* **Websocket Audio Sync**: Enable users to synchronize sequencer grids and tracks in real-time.
* **P2P Audio Streaming**: Implement WebRTC audio transport layers for instant vocal monitoring across remote clients.

Source:
* `packages/studio-core/src/lib/audioContextOptions.ts`
* `packages/studio-core/src/lib/drumAudio.ts`
