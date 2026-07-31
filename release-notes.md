Release Date: 2026-07-31

## Fixed
- Resolved OTA updater detection failure by comparing Firebase and GitHub Releases, adding strict HTTP cache control headers, and enforcing semver fallback comparison.
- Replaced updater download progress presentation with official COSS Progress component featuring right-aligned exact percentage and zero duplicated sub-labels.

## Added
- Completely rebuilt Appearance screen as the new reference implementation for Settings with cleaner hierarchy, glassmorphism cards, and premium spacing.
- Integrated Inspira UI Color Picker supporting Hex, RGB, RGBA, HSL, HSLA, custom swatches, and WCAG AA contrast ratio indicators.
