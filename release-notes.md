# Version 4.5.60

Release Date: 2026-09-04

### Added

- Stagex Setup Subsections Bilingual Localization: Implemented comprehensive English and Spanish translation coverage across all four Setup subviews—Technical Rider, Setlist Management, Gear Inventory, and Band & Crew Roster.
- Stagex History Surface & Floating Toolbar Localization: Integrated reactive bilingual dictionary hooks into the History surface and canvas floating action controls.
- Live Language Transition Architecture: Wired all Stagex setup components to `useT()` and `useSettingsStore` allowing instantaneous language switching (EN ↔ ES) with zero page reloads.
- Updater Ecosystem Bilingual Localization: Fully localized all updater states, progress bars, version comparisons, and action prompts in StudioUpdateScreen and UpdateIndicator.

### Improved

- Roadmap Language Governance: Maintained visible, disabled, and greyed-out future languages (de, fr, zh, pt, it, ja, ko) with standardized "Próximamente" / "Coming soon" status chips.
- Stagex Canvas Landscape Presentation: Decoupled the editing history surface and optimized full-screen canvas aspect ratios.
