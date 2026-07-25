Release Date: 2026-07-25

## Fixed
- Fixed React Error #300 & #310 hook ordering issues by ensuring all DevTools hooks run unconditionally at top-level.
- Fixed Event Diagnostics pipeline bug by recording touch and click gestures into the ring buffer continuously from app boot.

## Improved
- Unified Copy UX: introduced reusable dark pill `CopyButton` component with microinteractions, inline status transformation (`Copy` -> `Copied!`), and automatic 1.2s revert timer.
- Enhanced Top Copy Menu: `Copy Everything` exports all logs, warnings, errors, events, system & performance data formatted with clear section headers (`======================== Logs ========================`).
- Simplified Diagnostics Views: Performance, Network, System Diagnostics, and Storage tabs now feature clean 1-button copy exports with grouped categories.
- Removed Navigation Stack: deleted legacy navigation trace UI, state, collectors, and dead exports. Expanded search bar to circular-pill design (`borderRadius: 999px`).
