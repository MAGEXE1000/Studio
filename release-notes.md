# Version 4.5.26

Release Date: 2026-08-11

### Added

- Integrated the high-performance native Liquid Glass visual effect from `com.qmdeve:liquidglass:core:1.0.5` on the Studio Android bottom navigation bar.
- Normalized the bottom navigation bar height to exactly 42 px (collapsing to 21 px when scrolling).
- Implemented continuous layout rect tracking in React via RequestAnimationFrame to synchronize with the native positioning layer.
- Added a lightweight, theme-appropriate native drawable fallback background for Android versions older than Android 13 (API < 33).
