Release Date: 2026-07-24

## Improved
- Native updater cleanup: completely removed legacy `[Simulation Guard]` throw checks, simulation mode overrides, and developer simulation toasts.
- Native installation path: updater pipeline now executes real native PackageInstaller installation flow directly.
- Highlight geometry refinement: dynamic highlight algorithm un-clamped to perfectly wrap active tab icon and label comfortably on every tab, localization, and font scale.
- Scroll collapse geometry: removed parent container scale shift and enforced in-place center scaling for both dock and switcher button without corner drifting.
