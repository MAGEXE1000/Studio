Release Date: 2026-07-29

## Added
- Unified navigation transition architecture across all sub-apps and screens using Framer Motion projection (`StudioPageTransition`).
- Solved bottom navigation active highlight alignment at the root cause by embedding `layoutId="liquidActiveNavPill"` directly inside active item buttons.
- Eliminated abrupt navigation bar geometry jumps during tab switching across apps with different item counts.
- Enforced 100% centered highlight positioning across all screen orientations and font scaling sizes.
