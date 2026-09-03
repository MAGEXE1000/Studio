# Version 4.5.55

Release Date: 2026-09-03

### Improved

- Stagex Touch Dragging Pipeline: Optimized Android element dragging with unified W3C pointer capture (`setPointerCapture`), zero-deadzone touch responsiveness, and `requestAnimationFrame`-coalesced visual commits, eliminating drag latency, stepping, and stutter.
- Actions Menu Layering & Independence: Portaled the Stagex element Actions menu to `document.body` with viewport edge collision detection and smart vertical positioning, ensuring the menu is never clipped by collapsed or expanded Advanced Specs.
- Multi-Touch Gestures & Stage Sync: Seamlessly transitioned between element manipulation and two-finger pinch-to-zoom on Android, guaranteeing authoritative final coordinate synchronization with React state and PDF Export.
- Design Token Compliance: Normalized typography tokens in AccentColorPicker with canonical CSS variables.
