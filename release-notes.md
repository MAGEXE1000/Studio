Release Date: 2026-08-11

### Added
- Migrated Vocalex delete, sorting, and metadata actions to the stateful @beui/button-base design system.
- Migrated Studio Hub developer options controls to the stateful @beui/button-base button systems.
- Migrated all authentication, settings, preferences, and sub-app action buttons across Chordex, Groovex, and Stagex to BeUI design primitives.
- Ensured zero auditory feedback and neutral visual styling on the About page SpotlightLogo.
- Created canonical design tokens for spacing, typography, and surface floating elements in tokens.css.
- Migrated Studio Hub, Settings dashboards, scaffolds, and headers to layout tokens, eliminating hardcoded values.
- Added automated token check regression guard rule (pnpm check:tokens) in CI/build pipeline.
- Applied real backdrop-filter blur and metallic/reflective inner-bezel highlights to the bottom navigation bar and float buttons.
- Implemented Framer Motion elastic squish-and-stretch micro-animations on tab icon selection.
- Added direction-aware liquid/gooey transition stretching to active-tab indicator pill.
- Fixed tab scrubbing gestures via continuous fractional pointer indexing.
