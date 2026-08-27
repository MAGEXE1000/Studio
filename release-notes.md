# Version 4.5.44

Release Date: 2026-08-26

### Fixed

- Android Updater Changelog Correlation: Resolved long-standing static update dialog changelog display across releases. Implemented dynamic per-version release notes extraction in `studio-core` and wired `UpdateIndicator` to display release notes specific to the version being offered.
- Navigation Icon Mapping: Eliminated remaining `AnimatedNavigationIcon` unmapped warnings for `profile`, `user`, `account`, `drumex`, `stagex`, and `disc` by standardizing normalization routes and comprehensive `FILLED_VARIANTS_SUPPORT` coverage.
- Navigation Re-Render Optimization: Memoized animation context and tab icons in `NavigationAnimationProvider` and `AnimatedNavigationIcon`, eliminating redundant re-renders and false transition triggers during tab changes.
- Component Resolution Cache: Implemented module-level $O(1)$ component lookup caching in `AnimatedIcon`, removing per-render string parsing and Lucide reflection overhead.
- Livex Tab Animation Parity: Standardized tab-change animations to a unified 200ms cubic-bezier transition across all five Livex applications.
- Unified Subsection Top Bar: Finalized and unified the shared top bar structure across Chordex, Drumex, Stagex, Groovex, and Vocalex.
