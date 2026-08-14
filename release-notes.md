# Version 4.5.31

Release Date: 2026-08-13

### Added

- Implemented production-quality live-blur liquid-glass treatment for the shared Studio top bar with specular highlight rim, multi-layer gradient depth, and GPU compositing layer promotion (`transform: translateZ(0)`).
- Upgraded top bar theme tokens with calibrated contrast, bevel reflections, and solid fallback tints for Dark, Light, and AMOLED modes.
- Added dynamic app-specific bottom navigation items, elastic gliding active indicator highlight, and smooth drag-to-scrub navigation gestures.
- Cleaned Stagex production UI by eliminating the intrusive in-screen diagnostics floating overlay while preserving full telemetry in DevTools.
- Added bottom navigation startup lifecycle guard to prevent premature mounting or visual bleed-through during Studio boot/startup animation.
