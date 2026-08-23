# Version 4.5.37

Release Date: 2026-08-22

### Fixed

- Resolved Settings sub-pages navigation bug (Appearance, Help & Support, Report a Bug, Updater) where font ligature failure caused back icons to render as clipped text `"w_b"`, back button opacity was tied to scroll position, and isolated floating capsule obscured page titles.
- Rebuilt SharedFloatingHeader and SettingsScaffold with a full-width integrated Liquid Glass top bar, centered title, robust SVG vector back chevron, and proper top scroll padding.
- Hardened navigation stack handling in HubSettings and HubHelp to safely return to Settings root.

### Added

- Redesigned mobile bottom navigation with compact 58px height, soft 26px squircle radius, and vertical icon-above-label hierarchy matching native reference specifications.
- Section names now remain consistently visible below their respective icons across all resting states with zero layout shifting.
- Active navigation item indicator refactored as a soft 20px squircle lens that smoothly glides between tabs using critically damped spring physics.
- Matched separate Search and App Switcher action buttons to 58px / 26px radius with identical optical glass material and horizontal baseline alignment.
- Polished Profile Bento metric cards (Favorites, Progressions, Presets, Sync) by removing artificial 1px hard rim lines and colored background halos.
