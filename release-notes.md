# Version 4.2.38

Release Date: 2026-07-22

Release Date: 2026-07-22

## Improved
- Optimized search transitions by morphing with a compact upward growth (55vh) and removing heavy fullscreen backdrop blurs to avoid layout thrashing.
- Cached and deferred local-storage search index loading on mount to prevent CPU spikes during search open animations.
- Prevented Bottom Navigation bar disappearances by adding a deterministic reset call on scroll observer element unmount.
- Designed 5 new premium transition presets (Material Shared Axis, Premium Spring Slide, Elastic Morph, Floating Depth, Liquid Flow) in the Motion Playground with interactive simulator controls.
