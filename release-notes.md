# Version 4.5.69

Release Date: 2026-09-06

### Added

- Restored GrooveX Vinyl Turntable Audio Feedback: Restored authentic vinyl turntable scratch and platter brake audio feedback on pause and resume, operating via an independent dedicated turntableBus connected to masterGain without modifying stem playback rates.
- Pre-Synthesized Analytical Turntable AudioBuffers: Mathematically pre-synthesized 520ms vinyl platter deceleration stop and 260ms needle cue direct-drive spin-up AudioBuffers with anti-click zero-crossing envelopes, zero network latency, and zero decoding overhead.
- Drumex Metronome User-First Presets: Replaced factory presets with an intentional "MY PRESETS" empty state and full CRUD workflow (create, in-place edit, duplicate with unique copy names, rename, delete).
- Dual-Mode Incremental Tempo Progression: Implemented deterministic tempo progression engine supporting both By Bars (evaluated strictly at bar boundaries) and By Time (on the monotonic Web Audio clock) with live summary cards.
- Synchronized Visual Count-In Countdown: Added floating 4-3-2-1 countdown overlay locked to Web Audio beat schedule events, unmounting cleanly at the exact instant performance begins.

### Fixed & Improved

- Transposition & Stem Synchronization Preservation: All stem buffer sources remain locked to an invariant 1.0000x playback rate, guaranteeing 100% time and tempo preservation across -12 to +12 semitones with zero cumulative drift and bit-exact drum alignment.
- Android Media Controls Transport Alignment: Android notification shade, Quick Settings media card, lock screen, and Bluetooth play/pause actions seamlessly trigger the restored turntable stop and start audio feedback.
- Android Media Notification Badge Scaling: Redesigned notification artwork badge with generous padding and centered typography, eliminating SystemUI media card cropping and clipped BPM text.
- Neutral Accent Beat Toggle: Tapping the active accent beat toggles to a neutral state (-1) for unaccented metronome practice across all meters and subdivisions.
- Streamlined Rhythm Cards: Removed intrusive '+' tiles from Time Signature and Subdivision cards, presenting clean quick-selection grids alongside compact modal configuration triggers.
