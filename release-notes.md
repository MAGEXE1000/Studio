### Added
- Removed all experimental launch animation presets, keeping only the production Fluid Surface Reveal animation.
- Simplified Motion Playground to show only the Fluid Surface Reveal telemetry and preview.
- Fixed startup skeleton leak by enforcing solid background rendering styles on first paint frame.
- Resolved final transition flash by checking __studioStartupComplete and linking onComplete to onAnimationComplete.
- Implemented Bottom Navigation watchdog failsafe to recover visibility on route change, window focus, visibility change, resize, and orientation change.
