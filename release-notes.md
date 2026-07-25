Release Date: 2026-07-24

## Improved
- Consolidated Bottom Navigation: unified scroll-hide, inward convergence, and spacing across Hub, Chordex, Drumex, Stagex, Groovex, and Vocalex.
- Hub scroll-hide alignment: Hub Search bubble uses identical spring transforms (targetDockShift, targetSwitcherShift) as Chordex.
- Groovex centering: fixed layout positioning to guarantee 100% centered bottom navigation and App Changer.
- Universal scroll-hide: attached capturing touchmove listener in navScroll.ts for seamless scroll-hide across Stagex and Drumex.
- Apple-like press and drag gesture: added elementFromPoint gesture tracking for smooth highlight gliding across tabs under finger.
