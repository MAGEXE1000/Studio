# Version 4.5.40

Release Date: 2026-08-23

### Fixed

- Global AMOLED True Black: Fixed StageCorePanel settings fallback and replaced hardcoded near-black surfaces with var(--app-bg) to guarantee true #000000 black base across all internal apps, Hub, and Settings.
- Dark Mode Surface Polish: Darkened dark surface scale and glass tint to eliminate gray wash across bottom sheets, DrumEditor, SongsPanel, and AccountProfileHeader.
- Appearance Theme Mode Icons: Corrected Theme Toggle icon mapping to Light Mode -> Sun, Dark Mode -> Moon, and AMOLED Mode -> Eclipse with live spring transitions.
- Appearance Component Theming: Added --control-track-bg token and theme-adaptive borders/backgrounds across SegmentedControl, SettingRow, SettingSection, BentoSettingCard, and Language selector.
- Restored About Section in Settings: Restored About and Developer Options destinations in Settings > System & About with full theme support and seamless back navigation.
- App Changer Layout Overflow: Replaced asymmetrical 3-column grid with a centered responsive flex dock respecting horizontal safe-area insets, preventing clipping and viewport overflow across all Android screen sizes.
- Bottom Navigation Polish: Removed search satellite button from Hub home page and optimized satellite glass button dimensions to match the main dock.
