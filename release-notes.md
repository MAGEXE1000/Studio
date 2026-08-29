# Version 4.5.47

Release Date: 2026-08-28

### Added

- Global Accent Color System: Introduced a dedicated Accent Color configuration under Settings → Appearance with 9 curated design-system presets, custom RGB color picker, real-time live preview across all sub-apps, and full decoupling from individual sub-app identity branding.
- Dynamic Accent Theme Engine: Integrated `resolveAccent()` in `studio-core` to calculate contrast text, glow, borders, and gradient variants directly on `:root` custom properties.

### Fixed

- App Identity Decoupling: Removed hardcoded `[data-app-key]` theme overrides to ensure Drumex, Stagex, Groovex, Vocalex, and Chordex share the global interactive accent while preserving authentic app brand identity colors on Hub cards and logos.
- Desktop Logging Resilience: Enhanced host language server log stream handling to prevent unhandled stream write exceptions during high-throughput agent operations.
- Release Pipeline Verification: Added automated GitHub CLI keyring authentication fallback and strengthened end-to-end multi-manifest synchronization.
