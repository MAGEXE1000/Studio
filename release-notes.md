Release Date: 2026-07-24

## Improved
- Highlight geometry refinement: un-clamped and recalculated active highlight pill sizing (20px icon + 6px gap + 6.4px/char + 16px padding) for exact content wrapping without oversized pills or clipping.
- Complete scroll animation removal: purged scroll collapse listeners, scroll offset MotionValues, and scale interpolations so Bottom Navigation remains 100% static across all scroll interactions.
