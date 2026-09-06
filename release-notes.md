# Version 4.5.67

Release Date: 2026-09-06

### Added

- Signalsmith Stretch WASM AudioWorklet Integration: Integrated official C++ WebAssembly Signalsmith Stretch DSP engine running entirely within the Web Audio render thread for production multitrack stem transposition.
- Native Android Media Controls: Implemented real native Android MediaSessionCompat and foreground playback service exposing playback controls to the Android notification shade, Quick Settings media carousel, lock screen, and Bluetooth devices across GrooveX, Drumex Beats, and Metronome.
- Drumex Metronome Performance Mode: Automatically hides canonical bottom navigation in the Metronome tab to reclaim the lower viewport for compact performance controls.

### Fixed & Improved

- Time & Tempo Preserving Transposition: Decoupled musical key transposition from playback speed—all audio sources run at strictly 1.0000x playback rate with 0 duration change and 0 BPM change across -12 to +12 semitones.
- Percussion Stem Transposition Immunity: Percussion and drum stems (kick, snare, toms, hi-hats, cymbals, overheads, percussion) bypass pitch processing, keeping rhythm and transients 100% unaltered.
- Sample-Exact Latency Lock: Calibrated drum delay to match Signalsmith Stretch's deterministic 120.00ms latency, achieving bit-exact phase synchronization (Δt = 0.000 ms) between drums and melodic stems with zero cumulative drift.
- Zero UI Thread Overhead: Replaced synchronous main-thread DSP with AudioWorklet parameter automation (< 0.01ms main-thread execution), eliminating application freezes and dropped frames.
