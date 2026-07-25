Release Date: 2026-07-24

## Improved
- Deterministic initial highlight position: synchronous DOM measurement on initial mount places highlight pill directly at target coordinates.
- Navbar width safeguard: corrected maxBarWidth to reserve space for Search bubble on Hub, preventing search button from being pushed off-screen.
- Bounded highlight pill clamping: mathematically clamped pillX within dock bounds so highlight never exits navbar container.
- Micro-interaction hover animations: restored subtle scale micro-interactions (1.08x) on tab items for premium native feedback.
- Animated 60 FPS tab transitions: configured smooth spring physics across Home, Profile, and Settings tabs.
