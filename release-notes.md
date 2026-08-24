# Version 4.5.42

Release Date: 2026-08-24

### Fixed

- Developer Inspector Usability: Fixed broken refresh behavior to re-inspect the active DOM node's React fiber, bounds, and computed styles without resetting selection. Added quick target shortcuts for App Shell, Active View Container, and Navigation Bars.
- Interactive Component Subtree Tree Browser: Added real-time component search filtering, category filter pills (Interactive, React, DOM, Containers), collapsible tree nodes, and 1-tap inspection.
- Visual CSS Box Model: Added live nested Box Model visualization for Margin, Border, Padding, and Content dimensions with categorized CSS property tables (Layout, Typography, Surface/Effects).
- Performance Diagnostics Layout Overflow: Applied flexWrap and responsive truncation across component lifecycle profiler, frame pacing histograms, memory gauges, and GPU renderer strings to eliminate horizontal overflow on narrow Android viewports.
- Network Sniffer Consolidation: Consolidated standalone Network Sniffer into Logs, removing redundant subview routing while preserving full HTTP request inspection and 404 diagnostics.

### Added

- Tap-to-select capturing handler in Developer Inspector overlay for seamless element selection and automatic exit on select.
- Complete Studio design token integration (`--app-bg`, `--app-surface`, `--c-text-primary`, `--c-border`, `--studio-accent-from`) across Developer Inspector for seamless Light, Dark, and AMOLED modes.
