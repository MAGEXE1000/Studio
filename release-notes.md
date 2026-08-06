Release Date: 2026-08-06

### Improved
- Integrated Jetpack Compose natively and replaced theme transition with official InkFlow library reveal animation.
- Fixed updater decision pipeline state machine to correctly compare both SemVer and Android versionCode and handle inconsistent metadata.
- Resolved isUpdateDismissed timeout evaluation bug returning true by default.
- Prevented Color Picker saturation thumb boundary overflow and fixed HSL 360-degree hue reset.
- Normalized HSL proxy color values to HEX to resolve the frame-skipping drag rendering loop.
- Decoupled bottom navigation item button handlers from pointer event overrides, driving animations purely by navigation active state transitions.
