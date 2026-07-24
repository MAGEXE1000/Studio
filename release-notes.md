Release Date: 2026-07-24

## Improved
- Truly universal highlight sizing: dynamic active item content measurement (icon + gap + label + 24px padding) guarantees perfect active highlight wrapping without text clipping or undersized pills across all screens, including Preferences.
- Simplified scale-only collapse animation: completely replaced over-engineered collapse motion with clean center scaling (1.0 -> 0.70) with 0 translation (`y = 0`) and preserved 100% blur and opacity.
- Apple-grade spring restore: smooth 100% scale restoration on scroll up with natural overshoot and soft settle.
