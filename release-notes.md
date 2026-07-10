### Fixed
- Fixed Stagex splash and logo freeze when navigating away from the Stagex panel.
- Optimized iframe keep-alive limits inside Stagex by category-mapping views, reducing active background WebGL instances from 8 to at most 4.
- Added watchdog recovery callbacks to the launch transition system to force-dismiss the splash screen if a sub-app unmount takes longer than 4000ms.
- Unified native and web English changelogs to read from a single synchronized source of truth.
