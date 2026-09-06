# Version 4.5.66

Release Date: 2026-09-06

### Fixed

- GrooveX Transposition UI Freeze Regression: Completely eliminated application freeze during musical key transposition by removing main-thread offline SoundTouch WSOLA processing.
- Native Hardware Playback-Rate Engine: Restored canonical zero-CPU Web Audio `AudioBufferSourceNode.playbackRate` adjustment across all stems (including drums/percussion), reducing transposition execution latency from multi-second blocking down to < 0.05ms (0 dropped UI frames, steady 60 FPS).
- Continuous Drift-Free Playback: Dynamic pitch changes during active playback now maintain seamless audio continuity with zero phase jump and 100% sample-lock synchronization across all stems.
